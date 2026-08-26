import { Router } from 'express';
import { RestaurantController } from './restaurant.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireTenant } from '../../middleware/tenant.middleware';

const router = Router();
router.use(authenticate, requireTenant);

router.get('/branches', RestaurantController.getBranches);
router.post('/', RestaurantController.createBranch);
router.post('/verify-agent', RestaurantController.verifyAgent);
router.post('/:id/test-telegram-report', RestaurantController.testTelegramReport);
router.get('/:branchId/dashboard', RestaurantController.getBranchDashboard);
router.put('/:id', RestaurantController.updateRestaurant);

export default router;
