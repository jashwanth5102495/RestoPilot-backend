"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const whatsapp_web_js_1 = require("whatsapp-web.js");
const qrcode_1 = __importDefault(require("qrcode"));
const fs_1 = __importDefault(require("fs"));
let execPath = undefined;
if (fs_1.default.existsSync('/usr/bin/chromium')) {
    execPath = '/usr/bin/chromium';
}
else if (fs_1.default.existsSync('/usr/bin/chromium-browser')) {
    execPath = '/usr/bin/chromium-browser';
}
else if (fs_1.default.existsSync('/usr/bin/google-chrome')) {
    execPath = '/usr/bin/google-chrome';
}
class WhatsAppService {
    client;
    qrCodeUrl = null;
    status = 'DISCONNECTED';
    constructor() {
        this.client = new whatsapp_web_js_1.Client({
            authStrategy: new whatsapp_web_js_1.LocalAuth(),
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
    async requestPairingCode(phoneNumber) {
        if (this.status !== 'AWAITING_LOGIN' && this.status !== 'INITIALIZING') {
            throw new Error('WhatsApp client is not ready for pairing. Please wait until it initializes completely.');
        }
        try {
            // Clean phone number (remove +, spaces, etc)
            const cleanNumber = phoneNumber.replace(/\D/g, '');
            // Wait for page to be ready if it's still booting
            let attempts = 0;
            while (!this.client.pupPage && attempts < 15) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                attempts++;
            }
            if (!this.client.pupPage) {
                throw new Error('Browser page failed to initialize in time');
            }
            const code = await this.client.requestPairingCode(cleanNumber);
            return code;
        }
        catch (error) {
            console.error('Error requesting pairing code:', error);
            throw error;
        }
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
