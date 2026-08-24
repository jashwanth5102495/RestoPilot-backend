import { Router } from 'express';
import { OrderController } from './order.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireTenant } from '../../middleware/tenant.middleware';
import { authorize } from '../../middleware/role.middleware';
import { UserRole } from '../users/user.model';

const router = Router();

router.use(authenticate, requireTenant);

router.get('/', OrderController.getOrders);

// Waiter actions
router.post('/table', authorize(UserRole.OWNER, UserRole.MANAGER, UserRole.WAITER), OrderController.startTableOrder);
router.patch('/:orderId/items', authorize(UserRole.OWNER, UserRole.MANAGER, UserRole.WAITER), OrderController.updateOrderItems);
router.post('/:orderId/send', authorize(UserRole.OWNER, UserRole.MANAGER, UserRole.WAITER), OrderController.sendOrder);

// Kitchen actions
router.patch('/:orderId/status', authorize(UserRole.OWNER, UserRole.MANAGER, UserRole.KITCHEN), OrderController.updateOrderStatus);

export default router;
