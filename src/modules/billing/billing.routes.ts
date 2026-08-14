import { Router } from 'express';
import { BillingController } from './billing.controller';
import { validate } from '../../middleware/validation.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { requireTenant } from '../../middleware/tenant.middleware';
import { authorize } from '../../middleware/role.middleware';
import { UserRole } from '../users/user.model';
import { processSaleSchema } from './billing.schema';

const router = Router();

router.use(authenticate, requireTenant);

// Only specific roles can process sales
router.post(
  '/sale',
  authorize(UserRole.OWNER, UserRole.MANAGER, UserRole.CASHIER),
  validate(processSaleSchema),
  BillingController.processSale
);

router.post(
  '/subscription/pay',
  authorize(UserRole.OWNER),
  BillingController.paySubscription
);

router.post(
  '/data-request/pay',
  authorize(UserRole.OWNER),
  BillingController.payDataRequest
);

router.get(
  '/data-requests',
  authorize(UserRole.OWNER),
  BillingController.getDataRequests
);

export default router;
