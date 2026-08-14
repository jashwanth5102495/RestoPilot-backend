import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  })
});

export const registerRestaurantSchema = z.object({
  body: z.object({
    restaurantName: z.string().min(2, 'Restaurant name is required'),
    ownerName: z.string().min(2, 'Owner name is required'),
    phone: z.string().min(10, 'Valid phone number is required'),
    email: z.string().email('Invalid email address'),
    address: z.string().min(5, 'Address is required'),
    city: z.string().min(2, 'City is required'),
    state: z.string().min(2, 'State is required'),
    pincode: z.string().min(4, 'Pincode is required'),
    restaurantType: z.string().min(2, 'Restaurant type is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  })
});
