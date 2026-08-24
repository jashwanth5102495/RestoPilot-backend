import { Router } from 'express';
import { StaffController } from './staff.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireTenant } from '../../middleware/tenant.middleware';
import { authorize } from '../../middleware/role.middleware';
import { UserRole } from './user.model';

const router = Router();

// All staff endpoints require authentication, tenant, and ADMIN (OWNER/MANAGER) role
router.use(authenticate, requireTenant, authorize(UserRole.OWNER, UserRole.MANAGER));

router.get('/', StaffController.getStaff);
router.post('/', StaffController.createStaff);
router.patch('/:id', StaffController.updateStaff);
router.patch('/:id/reset-pin', StaffController.resetPin);

export default router;
