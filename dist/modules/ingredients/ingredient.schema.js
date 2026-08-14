"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateIngredientSchema = exports.createIngredientSchema = void 0;
const zod_1 = require("zod");
exports.createIngredientSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2, 'Name is required'),
        unit: zod_1.z.string().min(1, 'Unit is required'),
        sku: zod_1.z.string().optional(),
        minimumStock: zod_1.z.number().min(0).optional(),
        isActive: zod_1.z.boolean().optional(),
    })
});
exports.updateIngredientSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2).optional(),
        unit: zod_1.z.string().min(1).optional(),
        sku: zod_1.z.string().optional(),
        minimumStock: zod_1.z.number().min(0).optional(),
        isActive: zod_1.z.boolean().optional(),
    }),
    params: zod_1.z.object({
        id: zod_1.z.string().min(1, 'ID is required')
    })
});
