"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
async function fix() {
    await mongoose_1.default.connect('mongodb://127.0.0.1:27017/restopilot');
    await mongoose_1.default.connection.collection('users').updateOne({ email: 'mystery01' }, { $set: { email: 'mystery01@gmail.com' } });
    await mongoose_1.default.connection.collection('restaurants').updateOne({ email: 'mystery01@gmail.com' }, {
        $set: {
            isBillingEnabled: true,
            billingSlug: 'mystery-roaster-cafe',
            isOnlineOrderingEnabled: true,
            onlineSlug: 'mystery-roaster-cafe',
            isWaiterEnabled: true,
            waiterSlug: 'mystery-roaster-cafe',
            isKdsEnabled: true,
            kdsSlug: 'mystery-roaster-cafe'
        }
    });
    console.log('Fixed email and enabled all public portals for Mystery Roaster Cafe!');
    process.exit(0);
}
fix();
