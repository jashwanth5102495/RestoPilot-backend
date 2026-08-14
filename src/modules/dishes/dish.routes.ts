import { Router } from 'express';
import { DishController } from './dish.controller';
import { validate } from '../../middleware/validation.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { requireTenant } from '../../middleware/tenant.middleware';
import { createDishSchema, updateDishSchema } from './dish.schema';

const router = Router();

router.use(authenticate, requireTenant);

router.get('/', DishController.getDishes);
router.post('/', validate(createDishSchema), DishController.createDish);
router.put('/:id', validate(updateDishSchema), DishController.updateDish);
router.delete('/:id', DishController.deleteDish);

export default router;
