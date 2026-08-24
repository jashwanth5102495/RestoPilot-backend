"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitToTenant = exports.getIO = exports.initSocket = void 0;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../../config/env");
const logger_1 = require("./logger");
let io = null;
const initSocket = (httpServer) => {
    io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: env_1.env.FRONTEND_URL,
            credentials: true
        }
    });
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication error'));
            }
            const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_ACCESS_SECRET);
            socket.data.user = decoded;
            next();
        }
        catch (err) {
            next(new Error('Authentication error'));
        }
    });
    io.on('connection', (socket) => {
        const restaurantId = socket.data.user.restaurantId;
        if (restaurantId) {
            socket.join(`tenant:${restaurantId}`);
            logger_1.logger.info(`Socket ${socket.id} joined tenant room ${restaurantId}`);
        }
        socket.on('disconnect', () => {
            logger_1.logger.info(`Socket ${socket.id} disconnected`);
        });
    });
    return io;
};
exports.initSocket = initSocket;
const getIO = () => {
    if (!io) {
        throw new Error('Socket.IO not initialized');
    }
    return io;
};
exports.getIO = getIO;
const emitToTenant = (restaurantId, event, data) => {
    if (io) {
        io.to(`tenant:${restaurantId}`).emit(event, data);
    }
};
exports.emitToTenant = emitToTenant;
