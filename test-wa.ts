import whatsappService from './src/modules/notifications/whatsapp.service';
import { env } from './src/config/env';

async function test() {
  console.log('Testing WhatsApp initialization...');
  await whatsappService.initialize();
  console.log('Status:', whatsappService.getStatus());
  process.exit(0);
}
test();
