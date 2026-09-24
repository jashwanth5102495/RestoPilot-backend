import { Router } from 'express';
import { RecipeController } from './recipe.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireTenant } from '../../middleware/tenant.middleware';
import { requireSubscriptionAccess } from '../../middleware/subscription-access.middleware';

const router = Router();

router.use(authenticate, requireTenant, requireSubscriptionAccess);

router.get('/templates', RecipeController.getAllTemplates);
router.get('/templates/match', RecipeController.matchTemplate);
router.get('/', RecipeController.getRecipes);
router.post('/', RecipeController.updateRecipe);

export default router;
