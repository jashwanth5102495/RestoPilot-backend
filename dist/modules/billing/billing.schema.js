"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processSaleSchema = void 0;
const zod_1 = require("zod");
const order_model_1 = require("../../modules/orders/order.model");
exports.processSaleSchema = zod_1.z.object({
    body: zod_1.z.object({
        items: zod_1.z.array(zod_1.z.object({
            dishId: zod_1.z.string().min(1, 'Dish ID is required'),
            quantity: zod_1.z.number().min(1, 'Quantity must be at least 1')
        })).min(1, 'At least one item is required'),
        paymentMethod: zod_1.z.nativeEnum(order_model_1.PaymentMethod),
        customerId: zod_1.z.string().optional()
    })
});
