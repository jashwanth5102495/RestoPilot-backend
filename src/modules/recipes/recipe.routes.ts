import { Router } from 'express';
import { RecipeController } from './recipe.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireTenant } from '../../middleware/tenant.middleware';

const router = Router();

router.use(authenticate, requireTenant);

router.get('/templates/match', RecipeController.matchTemplate);
router.get('/', RecipeController.getRecipes);
router.post('/', RecipeController.updateRecipe);

export default router;
