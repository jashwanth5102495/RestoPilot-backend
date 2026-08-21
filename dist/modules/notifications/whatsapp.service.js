"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const whatsapp_web_js_1 = require("whatsapp-web.js");
const qrcode_1 = __importDefault(require("qrcode"));
class WhatsAppService {
    client;
    qrCodeUrl = null;
    status = 'DISCONNECTED';
    constructor() {
        this.client = new whatsapp_web_js_1.Client({
            authStrategy: new whatsapp_web_js_1.LocalAuth(),
            puppeteer: {
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
            }
        });
        this.client.on('qr', async (qr) => {
            this.status = 'INITIALIZING';
            try {
                this.qrCodeUrl = await qrcode_1.default.toDataURL(qr);
                console.log('WhatsApp QR Code generated.');
            }
            catch (err) {
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
    async initialize() {
        console.log('Initializing WhatsApp Client...');
        try {
            this.status = 'INITIALIZING';
            await this.client.initialize();
        }
        catch (error) {
            console.error('Failed to initialize WhatsApp Client:', error);
            this.status = 'DISCONNECTED';
        }
    }
    getQrCode() {
        return this.qrCodeUrl;
    }
    getStatus() {
        return this.status;
    }
    async sendMessage(number, text) {
        if (this.status !== 'CONNECTED') {
            throw new Error('WhatsApp client is not connected');
        }
        try {
            // whatsapp-web.js requires the number in a specific format ending with @c.us
            const chatId = `${number.replace(/\D/g, '')}@c.us`;
            await this.client.sendMessage(chatId, text);
            return true;
        }
        catch (error) {
            console.error('Error sending WhatsApp message:', error);
            throw error;
        }
    }
}
exports.default = new WhatsAppService();
