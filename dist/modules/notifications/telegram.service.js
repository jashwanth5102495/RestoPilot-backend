"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramService = void 0;
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const system_settings_model_1 = require("../settings/system-settings.model");
const fs_1 = __importDefault(require("fs"));
class TelegramService {
    static async getBotToken() {
        const setting = await system_settings_model_1.SystemSettings.findOne({ key: 'telegramBotToken' });
        return setting ? setting.value : null;
    }
    static async getBotInfo() {
        const token = await this.getBotToken();
        if (!token)
            return null;
        try {
            const bot = new node_telegram_bot_api_1.default(token, { polling: false });
            const me = await bot.getMe();
            return me;
        }
        catch (error) {
            console.error('Telegram bot verification failed:', error);
            return null;
        }
    }
    static async verifyToken(token) {
        try {
            const bot = new node_telegram_bot_api_1.default(token, { polling: false });
            const me = await bot.getMe();
            return me;
        }
        catch (error) {
            return null;
        }
    }
    static async sendMessage(chatId, text, mediaPath) {
        const token = await this.getBotToken();
        if (!token)
            throw new Error('Telegram bot token not configured');
        const bot = new node_telegram_bot_api_1.default(token, { polling: false });
        if (mediaPath && fs_1.default.existsSync(mediaPath)) {
            await bot.sendDocument(chatId, mediaPath, { caption: text });
        }
        else {
            await bot.sendMessage(chatId, text);
        }
    }
}
exports.TelegramService = TelegramService;
