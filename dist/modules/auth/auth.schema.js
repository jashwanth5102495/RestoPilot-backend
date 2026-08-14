"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRestaurantSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
exports.loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Invalid email address'),
        password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    })
});
exports.registerRestaurantSchema = zod_1.z.object({
    body: zod_1.z.object({
        restaurantName: zod_1.z.string().min(2, 'Restaurant name is required'),
        ownerName: zod_1.z.string().min(2, 'Owner name is required'),
        phone: zod_1.z.string().min(10, 'Valid phone number is required'),
        email: zod_1.z.string().email('Invalid email address'),
        address: zod_1.z.string().min(5, 'Address is required'),
        city: zod_1.z.string().min(2, 'City is required'),
        state: zod_1.z.string().min(2, 'State is required'),
        pincode: zod_1.z.string().min(4, 'Pincode is required'),
        restaurantType: zod_1.z.string().min(2, 'Restaurant type is required'),
        password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    })
});
