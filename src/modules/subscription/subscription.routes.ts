import { Router, Request, Response } from 'express';
import { SubscriptionController } from './subscription.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/role.middleware';
import { UserRole } from '../users/user.model';
import express from 'express';

const router = Router();

// Webhook endpoint needs the raw body for signature verification
// We apply express.raw() to preserve the raw bytes
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  (req, res, next) => {
    // Store raw body as string for webhook verification
    (req as any).rawBody = req.body.toString('utf8');
    // Parse JSON for regular body usage
    try {
      req.body = JSON.parse((req as any).rawBody);
    } catch (e) {
      req.body = {};
    }
    next();
  },
  SubscriptionController.handleWebhook
);

router.use(authenticate);

router.get('/price', SubscriptionController.getSubscriptionPrice);
router.get('/history', authorize(UserRole.OWNER), SubscriptionController.getPaymentHistory);
router.post('/create-order', authorize(UserRole.OWNER), SubscriptionController.createPaymentOrder);
router.post('/verify', authorize(UserRole.OWNER), SubscriptionController.verifyPayment);

export default router;
