import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { logger } from './logger';

let io: SocketIOServer | null = null;

export const initSocket = (httpServer: HttpServer) => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.FRONTEND_URL,
      credentials: true
    }
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }
      
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as any;
      socket.data.user = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const restaurantId = socket.data.user.restaurantId;
    if (restaurantId) {
      socket.join(`tenant:${restaurantId}`);
      logger.info(`Socket ${socket.id} joined tenant room ${restaurantId}`);
    }

    socket.on('disconnect', () => {
      logger.info(`Socket ${socket.id} disconnected`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

export const emitToTenant = (restaurantId: string, event: string, data: any) => {
  if (io) {
    io.to(`tenant:${restaurantId}`).emit(event, data);
  }
};
