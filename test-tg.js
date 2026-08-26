const TelegramBot = require('node-telegram-bot-api');

async function test() {
  try {
    const token = '8222612965:AAHNcKZcJ5Ge1f0q9pnuFCKiMDU-2Oa9uI4';
    console.log('Instantiating bot...');
    const bot = new TelegramBot(token, { polling: false });
    console.log('Calling getMe()...');
    const me = await bot.getMe();
    console.log('Success:', me);
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
