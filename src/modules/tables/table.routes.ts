import { Router } from 'express';
import { TableController } from './table.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/role.middleware';
import { requireTenant } from '../../middleware/tenant.middleware';
import { UserRole } from '../users/user.model';

const router = Router();

router.use(authenticate, requireTenant);

// Waiter, Manager, Owner, Billing can view tables
router.get('/', authorize(UserRole.OWNER, UserRole.MANAGER, UserRole.WAITER, UserRole.BILLING), TableController.getTables);

// Only Owner and Manager can manage tables
router.patch('/count', authorize(UserRole.OWNER, UserRole.MANAGER), TableController.updateTableCount);

export default router;
