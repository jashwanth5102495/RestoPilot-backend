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
router.post('/settings/kds', authenticate, requireTenant, PublicController.toggleKds);
router.post('/settings/inventory', authenticate, requireTenant, PublicController.toggleInventory);

// Public routes for waiter portal
router.get('/waiter/:slug/tables', PublicController.getWaiterTables);
router.get('/waiter/:slug/menu', PublicController.getWaiterMenu);
router.get('/waiter/:slug/tables/:tableId/order', PublicController.getWaiterTableOrder);
router.post('/waiter/:slug/tables/:tableId/order', PublicController.placeWaiterTableOrder);
router.post('/waiter/:slug/tables/:tableId/bill', PublicController.generateWaiterBill);

// Public routes for billing portal
router.get('/billing/:slug/menu', PublicController.getBillingMenu);
router.post('/billing/:slug/sale', PublicController.processBillingSale);
router.get('/billing/:slug/tables', PublicController.getBillingTables);
router.get('/billing/:slug/tables/:tableId/order', PublicController.getBillingTableOrder);
router.post('/billing/:slug/tables/:tableId/settle', PublicController.settleBillingTableOrder);
router.get('/billing/:slug/online-orders', PublicController.getBillingOnlineOrders);
router.post('/billing/:slug/online-orders/:orderId/settle', PublicController.settleBillingOnlineOrder);
router.patch('/billing/:slug/online-orders/:orderId/status', PublicController.updateBillingOnlineOrderStatus);
router.patch('/billing/:slug/dishes/:dishId/availability', PublicController.toggleDishAvailability);

// Public routes for KDS portal
router.get('/kds/:slug/orders', PublicController.getKdsOrders);
router.patch('/kds/:slug/orders/:orderId/status', PublicController.updateKdsOrderStatus);

// Public routes for Inventory portal
router.get('/inventory/:slug/ingredients', PublicController.getInventoryMenu);
router.post('/inventory/:slug/restock', PublicController.processInventoryRestock);

export default router;
