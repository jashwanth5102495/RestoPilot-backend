"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./shared/utils/sentry"); // Must be first
const app_1 = __importDefault(require("./app"));
const database_1 = require("./config/database");
const env_1 = require("./config/env");
const logger_1 = require("./shared/utils/logger");
const whatsapp_service_1 = __importDefault(require("./modules/notifications/whatsapp.service"));
const cron_service_1 = __importDefault(require("./modules/notifications/cron.service"));
const startServer = async () => {
    try {
        await (0, database_1.connectDatabase)();
        // Start background services (non-blocking)
        whatsapp_service_1.default.initialize().catch(err => {
            logger_1.logger.error(err, 'WhatsApp service failed to initialize');
        });
        cron_service_1.default.start();
        app_1.default.listen(env_1.env.PORT, () => {
            logger_1.logger.info(`🚀 Server running in ${env_1.env.NODE_ENV} mode on port ${env_1.env.PORT}`);
        });
    }
    catch (error) {
        logger_1.logger.error(error, 'Failed to start server:');
        process.exit(1);
    }
};
startServer();
