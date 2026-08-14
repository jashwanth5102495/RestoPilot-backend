"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateDishSchema = exports.createDishSchema = void 0;
const zod_1 = require("zod");
exports.createDishSchema = zod_1.z.object({
    body: zod_1.z.object({
        categoryId: zod_1.z.string().min(1, 'Category ID is required'),
        name: zod_1.z.string().min(2, 'Name is required'),
        description: zod_1.z.string().optional(),
        price: zod_1.z.number().min(0),
        taxRate: zod_1.z.number().min(0).optional(),
        isAvailable: zod_1.z.boolean().optional(),
    })
});
exports.updateDishSchema = zod_1.z.object({
    body: zod_1.z.object({
        categoryId: zod_1.z.string().optional(),
        name: zod_1.z.string().min(2).optional(),
        description: zod_1.z.string().optional(),
        price: zod_1.z.number().min(0).optional(),
        taxRate: zod_1.z.number().min(0).optional(),
        isAvailable: zod_1.z.boolean().optional(),
    }),
    params: zod_1.z.object({
        id: zod_1.z.string().min(1, 'ID is required')
    })
});
