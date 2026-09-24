import { Router } from 'express';
import { PublicController } from './public.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireTenant } from '../../middleware/tenant.middleware';
import { requirePublicSubscriptionAccess } from '../../middleware/subscription-access.middleware';

const router = Router();

// Public routes for customers
router.get('/restaurants/:slug', PublicController.getRestaurantMenu);
router.post('/restaurants/:slug/orders', requirePublicSubscriptionAccess, PublicController.placeOrder);

// Public routes for customer table QR ordering
router.get('/table-qr/:slug/tables/:tableId/menu', PublicController.getTableQrMenu);
router.post('/table-qr/:slug/tables/:tableId/order', requirePublicSubscriptionAccess, PublicController.placeTableQrOrder);

// Protected routes for owners
router.post('/settings/online-ordering', authenticate, requireTenant, PublicController.toggleOnlineOrdering);
router.post('/settings/waiter-ordering', authenticate, requireTenant, PublicController.toggleWaiterOrdering);
router.post('/settings/billing-ordering', authenticate, requireTenant, PublicController.toggleBillingOrdering);
router.post('/settings/kds', authenticate, requireTenant, PublicController.toggleKds);
router.post('/settings/inventory', authenticate, requireTenant, PublicController.toggleInventory);
router.post('/settings/table-qr', authenticate, requireTenant, PublicController.toggleTableQr);

// Public routes for waiter portal
router.get('/waiter/:slug/tables', PublicController.getWaiterTables);
router.get('/waiter/:slug/menu', PublicController.getWaiterMenu);
router.get('/waiter/:slug/tables/:tableId/order', PublicController.getWaiterTableOrder);
router.post('/waiter/:slug/tables/:tableId/order', requirePublicSubscriptionAccess, PublicController.placeWaiterTableOrder);
router.post('/waiter/:slug/tables/:tableId/bill', requirePublicSubscriptionAccess, PublicController.generateWaiterBill);

// Public routes for billing portal
router.get('/billing/:slug/menu', PublicController.getBillingMenu);
router.post('/billing/:slug/sale', requirePublicSubscriptionAccess, PublicController.processBillingSale);
router.get('/billing/:slug/tables', PublicController.getBillingTables);
router.get('/billing/:slug/tables/:tableId/order', PublicController.getBillingTableOrder);
router.post('/billing/:slug/tables/:tableId/settle', requirePublicSubscriptionAccess, PublicController.settleBillingTableOrder);
router.get('/billing/:slug/online-orders', PublicController.getBillingOnlineOrders);
router.post('/billing/:slug/online-orders/:orderId/settle', requirePublicSubscriptionAccess, PublicController.settleBillingOnlineOrder);
router.patch('/billing/:slug/online-orders/:orderId/status', requirePublicSubscriptionAccess, PublicController.updateBillingOnlineOrderStatus);
router.patch('/billing/:slug/dishes/:dishId/availability', requirePublicSubscriptionAccess, PublicController.toggleDishAvailability);
router.get('/billing/:slug/qr-table-orders', PublicController.getBillingQrTableOrders);
router.post('/billing/:slug/qr-table-orders/:orderId/settle', requirePublicSubscriptionAccess, PublicController.settleBillingQrTableOrder);

// Public routes for KDS portal
router.get('/kds/:slug/orders', requirePublicSubscriptionAccess, PublicController.getKdsOrders);
router.patch('/kds/:slug/orders/:orderId/status', requirePublicSubscriptionAccess, PublicController.updateKdsOrderStatus);

// Public routes for Inventory portal
router.get('/inventory/:slug/ingredients', requirePublicSubscriptionAccess, PublicController.getInventoryMenu);
router.post('/inventory/:slug/restock', requirePublicSubscriptionAccess, PublicController.processInventoryRestock);

export default router;
