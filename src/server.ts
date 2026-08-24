import './shared/utils/sentry'; // Must be first
import app from './app';
import { connectDatabase } from './config/database';
import { env } from './config/env';
import { logger } from './shared/utils/logger';

import whatsappService from './modules/notifications/whatsapp.service';
import cronService from './modules/notifications/cron.service';
import { runMysterySeedIfMissing } from './utils/seedMystery';

const startServer = async () => {
  try {
    await connectDatabase();
    
    await runMysterySeedIfMissing();

    // Start background services (non-blocking)
    whatsappService.initialize().catch(err => {
      logger.error(err, 'WhatsApp service failed to initialize');
    });
    cronService.start();

    app.listen(env.PORT, () => {
      logger.info(`🚀 Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    });
  } catch (error) {
    logger.error(error, 'Failed to start server:');
    process.exit(1);
  }
};

startServer();
