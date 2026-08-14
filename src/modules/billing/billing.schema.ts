import { z } from 'zod';
import { PaymentMethod } from '../../modules/orders/order.model';

export const processSaleSchema = z.object({
  body: z.object({
    items: z.array(z.object({
      dishId: z.string().min(1, 'Dish ID is required'),
      quantity: z.number().min(1, 'Quantity must be at least 1')
    })).min(1, 'At least one item is required'),
    paymentMethod: z.nativeEnum(PaymentMethod),
    customerId: z.string().optional()
  })
});
