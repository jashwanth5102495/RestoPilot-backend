import { Router } from 'express';
import { InventoryCheckController } from './inventory-check.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireTenant } from '../../middleware/tenant.middleware';

const router = Router();

router.use(authenticate, requireTenant);

router.get('/checks/status', InventoryCheckController.getCheckStatus);
router.post('/checks', InventoryCheckController.submitChecks);
router.get('/checks/history', InventoryCheckController.getCheckHistory);
router.patch('/checks/snooze', InventoryCheckController.snoozeReminder);

export default router;
