import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../shared/utils/logger';

export const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(env.MONGODB_URI);
    logger.info(`✅ Successfully connected to MongoDB at ${env.MONGODB_URI}`);
  } catch (error) {
    logger.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  logger.warn('⚠️ MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  logger.error('❌ MongoDB error:', err);
});
