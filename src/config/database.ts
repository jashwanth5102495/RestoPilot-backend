import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../shared/utils/logger';
import * as Sentry from '@sentry/node';

export const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(env.MONGODB_URI);
    logger.info('✅ Successfully connected to MongoDB');

    // Ensure Super Admin exists
    const { User, UserRole, UserStatus } = await import('../modules/users/user.model');
    const adminExists = await User.exists({ role: UserRole.SUPER_ADMIN });
    if (!adminExists) {
      const bcrypt = await import('bcryptjs');
      const passwordHash = await bcrypt.hash('admin123', 10);
      await User.create({
        name: 'System Administrator',
        email: 'admin@restopilot.com',
        passwordHash,
        role: UserRole.SUPER_ADMIN,
        status: UserStatus.ACTIVE,
      });
      logger.info('👤 Default Super Admin user created (admin@restopilot.com / admin123)');
    }
  } catch (error) {
    logger.error(error, '❌ MongoDB connection error');
    Sentry.captureException(error);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  logger.warn('⚠️ MongoDB disconnected');
  Sentry.captureMessage('MongoDB disconnected unexpectedly', 'warning');
});

mongoose.connection.on('error', (err) => {
  logger.error(err, '❌ MongoDB error');
  Sentry.captureException(err);
});
