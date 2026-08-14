import { Router } from 'express';
import { SetupController } from './setup.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireTenant } from '../../middleware/tenant.middleware';

const router = Router();

// Secure the setup route
router.use(authenticate, requireTenant);

router.post('/complete', SetupController.completeSetup);

export default router;
