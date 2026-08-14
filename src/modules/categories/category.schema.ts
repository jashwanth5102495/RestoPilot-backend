import { z } from 'zod';

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name is required'),
    description: z.string().optional(),
    displayOrder: z.number().optional(),
    isActive: z.boolean().optional(),
  })
});

export const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    displayOrder: z.number().optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().min(1, 'ID is required')
  })
});
