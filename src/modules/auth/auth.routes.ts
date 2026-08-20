import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validate } from '../../middleware/validation.middleware';
import { loginSchema, registerRestaurantSchema } from './auth.schema';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.post('/login', validate(loginSchema), AuthController.login);
router.post('/register', validate(registerRestaurantSchema), AuthController.registerRestaurant);
router.get('/me', authenticate, AuthController.getMe);
router.post('/switch-branch', authenticate, AuthController.switchBranch);

export default router;
