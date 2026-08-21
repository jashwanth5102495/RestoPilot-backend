import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode';

class WhatsAppService {
  private client: Client;
  private qrCodeUrl: string | null = null;
  private status: 'DISCONNECTED' | 'INITIALIZING' | 'CONNECTED' = 'DISCONNECTED';

  constructor() {
    this.client = new Client({
      authStrategy: new LocalAuth(),
      puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      }
    });

    this.client.on('qr', async (qr) => {
      this.status = 'INITIALIZING';
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
