import { Router } from 'express';
import { PurchaseController } from './purchase.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireTenant } from '../../middleware/tenant.middleware';
import { requireSubscriptionAccess } from '../../middleware/subscription-access.middleware';

const router = Router();

router.use(authenticate, requireTenant, requireSubscriptionAccess);

router.get('/', PurchaseController.getPurchases);
router.post('/', PurchaseController.createPurchase);

export default router;
