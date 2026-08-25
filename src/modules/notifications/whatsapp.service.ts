import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode';
import fs from 'fs';
import { execSync } from 'child_process';

const getExecutablePath = () => {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) return process.env.PUPPETEER_EXECUTABLE_PATH;
  
  try {
    if (process.platform === 'win32') {
      const paths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
      ];
      for (const p of paths) {
        if (fs.existsSync(p)) return p;
      }
    }
  } catch (e) {
    // Ignore errors
  }
  
  return undefined;
};

const execPath = getExecutablePath();

console.log('--- PUPPETEER DIAGNOSTICS ---');
console.log('PUPPETEER_EXECUTABLE_PATH env var:', process.env.PUPPETEER_EXECUTABLE_PATH);
console.log('Resolved execPath:', execPath);
if (execPath) {
  try {
    const cmd = process.platform === 'win32' ? 'where' : 'which';
    const resolved = execSync(`${cmd} "${execPath}"`).toString().trim();
    console.log(`Executable found in PATH at: ${resolved}`);
    console.log('Does file exist on disk?:', fs.existsSync(resolved));
  } catch (e) {
    console.log('Command not found in PATH or does not exist:', execPath);
  }
} else {
  console.log('No executable path provided, relying on local bundled chromium.');
}
console.log('-------------------------------');

class WhatsAppService {
  private client: Client;
  private qrCodeUrl: string | null = null;
  private status: 'DISCONNECTED' | 'INITIALIZING' | 'AWAITING_LOGIN' | 'CONNECTED' = 'DISCONNECTED';

  constructor() {
    this.client = new Client({
      authStrategy: new LocalAuth({
        dataPath: process.env.WHATSAPP_DATA_PATH || './.wwebjs_auth'
      }),
      puppeteer: {
        executablePath: execPath,
        headless: true,
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox', 
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ],
      }
    });

    this.client.on('loading_screen', (percent, message) => {
      console.log(`WhatsApp loading: ${percent}% - ${message}`);
    });

    this.client.on('qr', async (qr) => {
      this.status = 'AWAITING_LOGIN';
      try {
        this.qrCodeUrl = await qrcode.toDataURL(qr);
        console.log('WhatsApp QR Code generated.');
      } catch (err) {
        console.error('Error generating QR code:', err);
      }
    });

    this.client.on('ready', () => {
      this.status = 'CONNECTED';
      this.qrCodeUrl = null;
      console.log('WhatsApp Client is ready!');
    });

    this.client.on('disconnected', (reason) => {
      this.status = 'DISCONNECTED';
      console.log('WhatsApp Client was disconnected:', reason);
    });
  }

  public async initialize() {
    console.log('Initializing WhatsApp Client...');
    try {
      this.status = 'INITIALIZING';
      await this.client.initialize();
    } catch (error) {
      console.error('Failed to initialize WhatsApp Client:', error);
      this.status = 'DISCONNECTED';
    }
  }

  public getQrCode() {
    return this.qrCodeUrl;
  }

  public getStatus() {
    return this.status;
  }

  public async requestPairingCode(phoneNumber: string) {
    if (this.status !== 'AWAITING_LOGIN' && this.status !== 'INITIALIZING') {
      throw new Error('WhatsApp client is not ready for pairing. Please wait until it initializes completely.');
    }
    
    try {
      // Clean phone number (remove +, spaces, etc)
      const cleanNumber = phoneNumber.replace(/\D/g, '');
      
      // Wait for page to be ready if it's still booting
      let attempts = 0;
      while (!(this.client as any).pupPage && attempts < 15) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }
      
      if (!(this.client as any).pupPage) {
        throw new Error('Browser page failed to initialize in time');
      }

      const code = await this.client.requestPairingCode(cleanNumber);
      return code;
    } catch (error) {
      console.error('Error requesting pairing code:', error);
      throw error;
    }
  }

  public async sendMessage(number: string, text: string) {
    if (this.status !== 'CONNECTED') {
      throw new Error('WhatsApp client is not connected');
    }
    
    try {
      // whatsapp-web.js requires the number in a specific format ending with @c.us
      const chatId = `${number.replace(/\D/g, '')}@c.us`;
      await this.client.sendMessage(chatId, text);
      return true;
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      throw error;
    }
  }
}

export default new WhatsAppService();
