import { Router } from 'express';
import { IngredientController } from './ingredient.controller';
import { validate } from '../../middleware/validation.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { requireTenant } from '../../middleware/tenant.middleware';
import { createIngredientSchema, updateIngredientSchema } from './ingredient.schema';

const router = Router();

router.use(authenticate, requireTenant);

router.get('/', IngredientController.getIngredients);
router.post('/', validate(createIngredientSchema), IngredientController.createIngredient);
router.put('/:id', validate(updateIngredientSchema), IngredientController.updateIngredient);
router.delete('/:id', IngredientController.deleteIngredient);

export default router;
