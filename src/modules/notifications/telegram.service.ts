const TelegramBot = require('node-telegram-bot-api');
import { SystemSettings } from '../settings/system-settings.model';
import fs from 'fs';

export class TelegramService {
  private static async getBotToken(): Promise<string | null> {
    const setting = await SystemSettings.findOne({ key: 'telegramBotToken' });
    return setting ? setting.value : null;
  }

  static async getBotInfo() {
    const token = await this.getBotToken();
    if (!token) return null;
    
    try {
      const bot = new TelegramBot(token, { polling: false });
      const me = await bot.getMe();
      return me;
    } catch (error) {
      console.error('Telegram bot verification failed:', error);
      return null;
    }
  }

  static async verifyToken(token: string) {
    try {
      const bot = new TelegramBot(token, { polling: false });
      const me = await bot.getMe();
      return me;
    } catch (error) {
      return null;
    }
  }

  static async sendMessage(chatId: string, text: string, mediaPath?: string) {
    const token = await this.getBotToken();
    if (!token) throw new Error('Telegram bot token not configured');

    const bot = new TelegramBot(token, { polling: false });

    if (mediaPath && fs.existsSync(mediaPath)) {
      await bot.sendDocument(chatId, mediaPath, { caption: text });
    } else {
      await bot.sendMessage(chatId, text);
    }
  }
}
