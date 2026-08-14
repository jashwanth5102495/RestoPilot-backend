import { z } from 'zod';

export const createIngredientSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name is required'),
    unit: z.string().min(1, 'Unit is required'),
    sku: z.string().optional(),
    minimumStock: z.number().min(0).optional(),
    isActive: z.boolean().optional(),
  })
});

export const updateIngredientSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    unit: z.string().min(1).optional(),
    sku: z.string().optional(),
    minimumStock: z.number().min(0).optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().min(1, 'ID is required')
  })
});
