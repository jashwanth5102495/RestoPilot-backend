import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';

import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/error.middleware';
import authRoutes from './modules/auth/auth.routes';
import categoryRoutes from './modules/categories/category.routes';
import dishRoutes from './modules/dishes/dish.routes';
import ingredientRoutes from './modules/ingredients/ingredient.routes';
import billingRoutes from './modules/billing/billing.routes';
import setupRoutes from './modules/setup/setup.routes';
import adminRoutes from './modules/admin/admin.routes';
import publicRoutes from './modules/public/public.routes';
import restaurantRoutes from './modules/restaurants/restaurant.routes';
import orderRoutes from './modules/orders/order.routes';
import recipeRoutes from './modules/recipes/recipe.routes';
import supplierRoutes from './modules/suppliers/supplier.routes';
import purchaseRoutes from './modules/purchases/purchase.routes';

const app = express();

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later.' }
});

// Middlewares
app.use(helmet());
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health Check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    database: 'connected', 
    timestamp: new Date().toISOString(),
  });
});

app.get('/ready', (req: Request, res: Response) => {
  res.status(200).send('ready');
});

// Routes
app.use('/api/v1/auth', apiLimiter, authRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/dishes', dishRoutes);
app.use('/api/v1/ingredients', ingredientRoutes);
app.use('/api/v1/billing', billingRoutes);
app.use('/api/v1/setup', setupRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/public', publicRoutes);
app.use('/api/v1/restaurants', restaurantRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/recipes', recipeRoutes);
app.use('/api/v1/suppliers', supplierRoutes);
app.use('/api/v1/purchases', purchaseRoutes);

app.use('/api/v1', (req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'API Route Not Found' });
});

// Global Error Handler
app.use(errorHandler);

export default app;
