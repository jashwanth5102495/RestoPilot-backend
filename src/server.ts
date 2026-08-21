import app from './app';
import { connectDatabase } from './config/database';
import { env } from './config/env';
import { logger } from './shared/utils/logger';

import whatsappService from './modules/notifications/whatsapp.service';
import cronService from './modules/notifications/cron.service';

const startServer = async () => {
  try {
    await connectDatabase();
    
    // Start background services (non-blocking)
    whatsappService.initialize().catch(err => {
      logger.error('WhatsApp service failed to initialize', err);
    });
    cronService.start();

    app.listen(env.PORT, () => {
      logger.info(`🚀 Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
