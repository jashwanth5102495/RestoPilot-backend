import { Router } from 'express';
import { CategoryController } from './category.controller';
import { validate } from '../../middleware/validation.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { requireTenant } from '../../middleware/tenant.middleware';
import { createCategorySchema, updateCategorySchema } from './category.schema';

const router = Router();

router.use(authenticate, requireTenant);

router.get('/', CategoryController.getCategories);
router.post('/', validate(createCategorySchema), CategoryController.createCategory);
router.put('/:id', validate(updateCategorySchema), CategoryController.updateCategory);
router.delete('/:id', CategoryController.deleteCategory);

export default router;
