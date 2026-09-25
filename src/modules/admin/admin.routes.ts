import { Router } from 'express';
import { AdminController } from './admin.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { UserRole } from '../users/user.model';
import { UnauthorizedError } from '../../shared/errors/AppError';
import { Request, Response, NextFunction } from 'express';
import { AutoPayController } from '../subscription/controllers/autopay.controller';

const router = Router();

// Middleware to enforce Super Admin role
const requireSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== UserRole.SUPER_ADMIN) {
    return next(new UnauthorizedError('Requires SUPER_ADMIN role'));
  }
  next();
};

router.use(authenticate, requireSuperAdmin);

router.get('/restaurants', AdminController.getRestaurants);
router.delete('/restaurants/:id', AdminController.deleteRestaurant);
router.put('/restaurants/:id/features', AdminController.updateRestaurantFeatures);
router.patch('/restaurants/:id/features', AdminController.updateRestaurantFeatures);
router.get('/backup/export', AdminController.exportBackup);
router.delete('/backup/wipe', AdminController.wipeBackup);
router.get('/data-requests', AdminController.getDataRequests);
router.post('/data-requests/:id/fulfill', AdminController.fulfillDataRequest);
router.get('/agents', AdminController.getAgents);
router.post('/agents', AdminController.createAgent);
router.delete('/agents/:id', AdminController.deleteAgent);
router.get('/telegram/status', AdminController.getTelegramStatus);
router.post('/telegram/token', AdminController.saveTelegramToken);

router.get('/subscription-price', AdminController.getSubscriptionPrice);
router.put('/subscription-price', AdminController.updateSubscriptionPrice);
router.get('/subscriptions', AutoPayController.adminList);
router.patch('/subscriptions/:restaurantId', AutoPayController.adminUpdate);
router.post('/subscriptions/payments/:paymentId/refund', AutoPayController.adminRefund);

export default router;
