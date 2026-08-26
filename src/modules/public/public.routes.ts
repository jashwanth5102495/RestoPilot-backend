import { Router } from 'express';
import { PublicController } from './public.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireTenant } from '../../middleware/tenant.middleware';

const router = Router();

// Public routes for customers
router.get('/restaurants/:slug', PublicController.getRestaurantMenu);
router.post('/restaurants/:slug/orders', PublicController.placeOrder);

// Protected routes for owners
router.post('/settings/online-ordering', authenticate, requireTenant, PublicController.toggleOnlineOrdering);
router.post('/settings/waiter-ordering', authenticate, requireTenant, PublicController.toggleWaiterOrdering);
router.post('/settings/billing-ordering', authenticate, requireTenant, PublicController.toggleBillingOrdering);

// Public routes for waiter portal
router.get('/waiter/:slug/tables', PublicController.getWaiterTables);
router.get('/waiter/:slug/menu', PublicController.getWaiterMenu);
router.get('/waiter/:slug/tables/:tableId/order', PublicController.getWaiterTableOrder);
router.post('/waiter/:slug/tables/:tableId/order', PublicController.placeWaiterTableOrder);
router.post('/waiter/:slug/tables/:tableId/bill', PublicController.generateWaiterBill);

// Public routes for billing portal
router.get('/billing/:slug/menu', PublicController.getBillingMenu);
router.post('/billing/:slug/sale', PublicController.processBillingSale);

export default router;
