import { z } from 'zod';

export const createDishSchema = z.object({
  body: z.object({
    categoryId: z.string().min(1, 'Category ID is required'),
    name: z.string().min(2, 'Name is required'),
    description: z.string().optional(),
    price: z.number().min(0),
    taxRate: z.number().min(0).optional(),
    isAvailable: z.boolean().optional(),
  })
});

export const updateDishSchema = z.object({
  body: z.object({
    categoryId: z.string().optional(),
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    price: z.number().min(0).optional(),
    taxRate: z.number().min(0).optional(),
    isAvailable: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().min(1, 'ID is required')
  })
});
