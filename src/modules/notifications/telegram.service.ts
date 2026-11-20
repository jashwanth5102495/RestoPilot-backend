import TelegramBot from 'node-telegram-bot-api';
import { SystemSettings } from '../settings/system-settings.model';
import fs from 'fs';

export class TelegramService {
  private static async getBotToken(): Promise<string | null> {
    try {
      const setting = await SystemSettings.findOne({ key: 'telegramBotToken' });
      if (setting && setting.value) return setting.value;
    } catch {}
    return process.env.TELEGRAM_BOT_TOKEN || null;
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
    if (!token) throw new Error('Telegram bot token not configured. Please configure it in the Admin Telegram Setup or TELEGRAM_BOT_TOKEN environment variable.');

    const bot = new TelegramBot(token, { polling: false });

    if (mediaPath && fs.existsSync(mediaPath)) {
      try {
        await bot.sendDocument(chatId, mediaPath, { caption: text, parse_mode: 'Markdown' });
        return;
      } catch (docErr) {
        console.warn('Failed to send document via Telegram, falling back to text message:', docErr);
      }
    }
    
    try {
      await bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
    } catch {
      // Fallback without parse_mode in case of markdown parsing issue
      await bot.sendMessage(chatId, text);
    }
  }
}
