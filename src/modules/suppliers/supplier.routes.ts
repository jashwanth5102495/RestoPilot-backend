import { Router } from 'express';
import { SupplierController } from './supplier.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireTenant } from '../../middleware/tenant.middleware';
import { requireSubscriptionAccess } from '../../middleware/subscription-access.middleware';

const router = Router();

router.use(authenticate, requireTenant, requireSubscriptionAccess);

router.get('/', SupplierController.getSuppliers);
router.post('/', SupplierController.createSupplier);
router.put('/:id', SupplierController.updateSupplier);
router.delete('/:id', SupplierController.deleteSupplier);

export default router;
