import './shared/utils/sentry'; // Must be first
import app from './app';
import { connectDatabase } from './config/database';
import { env } from './config/env';
import { logger } from './shared/utils/logger';

import cronService from './modules/notifications/cron.service';
import { runMysterySeedIfMissing } from './utils/seedMystery';

const startServer = async () => {
  try {
    await connectDatabase();
    
    await runMysterySeedIfMissing();

    // Start background services (non-blocking)
    cronService.start();

    const { createServer } = await import('http');
    const { initSocket } = await import('./shared/utils/socket');
    
    const httpServer = createServer(app);
    initSocket(httpServer);

    httpServer.listen(env.PORT, () => {
      logger.info(`🚀 Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    });
  } catch (error) {
    logger.error(error, 'Failed to start server:');
    process.exit(1);
  }
};

startServer();
