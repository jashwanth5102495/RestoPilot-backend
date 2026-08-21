"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Restaurant = exports.SubscriptionStatus = exports.RestaurantStatus = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var RestaurantStatus;
(function (RestaurantStatus) {
    RestaurantStatus["ACTIVE"] = "ACTIVE";
    RestaurantStatus["SUSPENDED"] = "SUSPENDED";
    RestaurantStatus["INACTIVE"] = "INACTIVE";
})(RestaurantStatus || (exports.RestaurantStatus = RestaurantStatus = {}));
var SubscriptionStatus;
(function (SubscriptionStatus) {
    SubscriptionStatus["ACTIVE"] = "ACTIVE";
    SubscriptionStatus["EXPIRED"] = "EXPIRED";
    SubscriptionStatus["PENDING"] = "PENDING";
})(SubscriptionStatus || (exports.SubscriptionStatus = SubscriptionStatus = {}));
const RestaurantSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    ownerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    phone: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    gstNumber: { type: String },
    restaurantType: { type: String, required: true },
    logo: { type: String },
    openingTime: { type: String },
    closingTime: { type: String },
    status: { type: String, enum: Object.values(RestaurantStatus), default: RestaurantStatus.ACTIVE },
    currency: { type: String, default: 'INR' },
    timezone: { type: String, default: 'Asia/Kolkata' },
    isOnlineOrderingEnabled: { type: Boolean, default: false },
    onlineSlug: { type: String },
    subscriptionStatus: { type: String, enum: Object.values(SubscriptionStatus), default: SubscriptionStatus.PENDING },
    subscriptionExpiresAt: { type: Date },
    parentRestaurantId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Restaurant' },
    notificationSettings: {
        whatsappNumber: { type: String },
        scheduledTime: { type: String },
        enabled: { type: Boolean, default: false }
    }
}, { timestamps: true });
RestaurantSchema.index({ onlineSlug: 1 }, { unique: true, sparse: true });
RestaurantSchema.index({ parentRestaurantId: 1 });
exports.Restaurant = mongoose_1.default.model('Restaurant', RestaurantSchema);
