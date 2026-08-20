import { Router } from 'express';
import { RestaurantController } from './restaurant.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireTenant } from '../../middleware/tenant.middleware';

const router = Router();
router.use(authenticate, requireTenant);

router.get('/branches', RestaurantController.getBranches);
router.get('/:branchId/dashboard', RestaurantController.getBranchDashboard);

export default router;
