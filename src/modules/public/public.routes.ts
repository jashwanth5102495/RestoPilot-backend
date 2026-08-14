import { Router } from 'express';
import { PublicController } from './public.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

// Public routes for customers
router.get('/restaurants/:slug', PublicController.getRestaurantMenu);
router.post('/restaurants/:slug/orders', PublicController.placeOrder);

// Protected routes for owners (to toggle online ordering)
router.post('/settings/online-ordering', authenticate, PublicController.toggleOnlineOrdering);

export default router;
