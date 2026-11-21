import { makeWASocket, useMultiFileAuthState, DisconnectReason, WASocket } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode';
import pino from 'pino';
import fs from 'fs';
import path from 'path';

interface WhatsAppSession {
  sock?: WASocket;
  status: 'DISCONNECTED' | 'CONNECTING' | 'SCAN_QR' | 'CONNECTED';
  qrCode?: string;
  connectedNumber?: string;
  reconnectAttempts: number;
}

export class WhatsAppService {
  private static sessions = new Map<string, WhatsAppSession>();

  private static getSessionsBaseDir(): string {
    const baseDir = path.join(process.cwd(), 'whatsapp_sessions');
    if (!fs.existsSync(baseDir)) {
      try {
        fs.mkdirSync(baseDir, { recursive: true });
      } catch {}
    }
    return baseDir;
  }

  private static getRestaurantSessionDir(restaurantId: string): string {
    const cleanId = restaurantId.replace(/[^a-zA-Z0-9_-]/g, '');
    const dir = path.join(this.getSessionsBaseDir(), `rest_${cleanId}`);
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch {}
    }
    return dir;
  }

  /**
   * Initializes or gets the active WhatsApp Web socket for a restaurant.
   */
  static async initClient(restaurantId: string): Promise<WhatsAppSession> {
    const existing = this.sessions.get(restaurantId);
    if (existing && existing.sock && existing.status === 'CONNECTED') {
      return existing;
    }

    const sessionDir = this.getRestaurantSessionDir(restaurantId);
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

    const sessionData: WhatsAppSession = {
      status: 'CONNECTING',
      reconnectAttempts: existing ? existing.reconnectAttempts : 0,
    };
    this.sessions.set(restaurantId, sessionData);

    try {
      const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: ['RestoPilot POS', 'Chrome', '1.0.0'],
        syncFullHistory: false,
      });

      sessionData.sock = sock;

      sock.ev.on('creds.update', saveCreds);

      sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          try {
            const qrDataUrl = await qrcode.toDataURL(qr, { margin: 2, width: 280 });
            sessionData.qrCode = qrDataUrl;
            sessionData.status = 'SCAN_QR';
          } catch (qrErr) {
            console.error('Failed to convert WhatsApp QR to data URL:', qrErr);
          }
        }

        if (connection === 'open') {
          sessionData.status = 'CONNECTED';
          sessionData.qrCode = undefined;
          sessionData.reconnectAttempts = 0;
          const userJid = sock.user?.id || '';
          sessionData.connectedNumber = userJid.split(':')[0] || userJid.split('@')[0];
          console.log(`[WhatsApp] Restaurant ${restaurantId} linked successfully to ${sessionData.connectedNumber}`);
        }

        if (connection === 'close') {
          const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

          console.warn(`[WhatsApp] Connection closed for restaurant ${restaurantId}. Reason: ${statusCode}, shouldReconnect: ${shouldReconnect}`);

          if (shouldReconnect) {
            sessionData.status = 'CONNECTING';
            if (sessionData.reconnectAttempts < 5) {
              sessionData.reconnectAttempts++;
              setTimeout(() => {
                this.initClient(restaurantId).catch(console.error);
              }, 4000);
            } else {
              sessionData.status = 'DISCONNECTED';
            }
          } else {
            // Logged out: remove credentials
            sessionData.status = 'DISCONNECTED';
            sessionData.sock = undefined;
            sessionData.qrCode = undefined;
            sessionData.connectedNumber = undefined;
            this.clearSessionFolder(sessionDir);
          }
        }
      });

      return sessionData;
    } catch (err) {
      console.error(`[WhatsApp] Failed to create socket for restaurant ${restaurantId}:`, err);
      sessionData.status = 'DISCONNECTED';
      return sessionData;
    }
  }

  /**
   * Returns current WhatsApp connection status for a restaurant.
   */
  static async getStatus(restaurantId: string): Promise<{
    status: 'DISCONNECTED' | 'CONNECTING' | 'SCAN_QR' | 'CONNECTED';
    qrCode?: string;
    connectedNumber?: string;
  }> {
    let session = this.sessions.get(restaurantId);

    // If session doesn't exist, check if there's already saved credentials on disk
    if (!session) {
      const sessionDir = this.getRestaurantSessionDir(restaurantId);
      const credsFile = path.join(sessionDir, 'creds.json');
      if (fs.existsSync(credsFile)) {
        session = await this.initClient(restaurantId);
      }
    }

    if (!session) {
      return { status: 'DISCONNECTED' };
    }

    return {
      status: session.status,
      qrCode: session.qrCode,
      connectedNumber: session.connectedNumber,
    };
  }

  /**
   * Request a new QR Code to link a phone.
   */
  static async requestQrCode(restaurantId: string): Promise<{
    status: string;
    qrCode?: string;
    connectedNumber?: string;
  }> {
    const session = await this.initClient(restaurantId);
    return {
      status: session.status,
      qrCode: session.qrCode,
      connectedNumber: session.connectedNumber,
    };
  }

  /**
   * Unlinks and disconnects WhatsApp for a restaurant.
   */
  static async disconnect(restaurantId: string): Promise<void> {
    const session = this.sessions.get(restaurantId);
    if (session?.sock) {
      try {
        await session.sock.logout();
      } catch {}
      try {
        session.sock.end(undefined);
      } catch {}
    }

    this.sessions.delete(restaurantId);
    const sessionDir = this.getRestaurantSessionDir(restaurantId);
    this.clearSessionFolder(sessionDir);
    console.log(`[WhatsApp] Unlinked session for restaurant ${restaurantId}`);
  }

  /**
   * Sends a WhatsApp text message or document (PDF) to a phone number.
   */
  static async sendMessage(
    restaurantId: string,
    toPhone: string,
    text: string,
    mediaPath?: string
  ): Promise<void> {
    let clean = (toPhone || '').replace(/\D/g, '');
    if (!clean) {
      throw new Error('WhatsApp phone number is missing or invalid.');
    }

    // Default to Indian country code 91 if 10-digit number is provided
    if (clean.length === 10) {
      clean = '91' + clean;
    }

    const jid = `${clean}@s.whatsapp.net`;

    let session = this.sessions.get(restaurantId);
    if (!session || !session.sock || session.status !== 'CONNECTED') {
      // Try to re-connect if creds exist
      session = await this.initClient(restaurantId);
      // Wait up to 3 seconds for connection to establish
      if (session.status !== 'CONNECTED') {
        let waited = 0;
        while (waited < 3000 && session.status !== 'CONNECTED') {
          await new Promise((r) => setTimeout(r, 500));
          waited += 500;
          session = this.sessions.get(restaurantId) || session;
        }
      }
    }

    if (!session || !session.sock || session.status !== 'CONNECTED') {
      throw new Error(
        'WhatsApp is not connected for this restaurant. Please open the Notifications tab and scan the QR code to link your WhatsApp account.'
      );
    }

    const sock = session.sock;

    if (mediaPath && fs.existsSync(mediaPath)) {
      try {
        const fileBuffer = fs.readFileSync(mediaPath);
        const fileName = path.basename(mediaPath);
        await sock.sendMessage(jid, {
          document: fileBuffer,
          mimetype: 'application/pdf',
          fileName,
          caption: text,
        });
        return;
      } catch (mediaErr) {
        console.warn('[WhatsApp] Failed to send document, falling back to text message:', mediaErr);
      }
    }

    await sock.sendMessage(jid, { text });
  }

  private static clearSessionFolder(dir: string) {
    if (!fs.existsSync(dir)) return;
    try {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        fs.unlinkSync(path.join(dir, file));
      }
      fs.rmdirSync(dir);
    } catch (e) {
      console.warn('Could not cleanly delete WhatsApp session dir:', e);
    }
  }
}
