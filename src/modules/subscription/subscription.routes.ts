import { Router, Request, Response } from 'express';
import { SubscriptionController } from './controllers/subscription.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/role.middleware';
import { UserRole } from '../users/user.model';
import express from 'express';
import { AutoPayController } from './controllers/autopay.controller';

const router = Router();

// Webhook endpoint needs the raw body for signature verification
// We apply express.raw() to preserve the raw bytes
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  (req, res, next) => {
    if (!(req as any).rawBody && Buffer.isBuffer(req.body)) {
      (req as any).rawBody = req.body.toString('utf8');
    }
    const rawBody = (req as any).rawBody || (Buffer.isBuffer(req.body) ? req.body.toString('utf8') : JSON.stringify(req.body));
    (req as any).rawBody = rawBody;
    try {
      if (Buffer.isBuffer(req.body) || typeof req.body === 'string') req.body = JSON.parse(rawBody);
    } catch (e) {
      req.body = {};
    }
    next();
  },
  SubscriptionController.handleWebhook
);

router.use(authenticate);

router.get('/price', SubscriptionController.getSubscriptionPrice);
router.get('/status', AutoPayController.getStatus);
router.get('/history', authorize(UserRole.OWNER), SubscriptionController.getPaymentHistory);
router.post('/create-order', authorize(UserRole.OWNER), SubscriptionController.createPaymentOrder);
router.post('/verify', authorize(UserRole.OWNER), SubscriptionController.verifyPayment);
router.post('/autopay/create', authorize(UserRole.OWNER), AutoPayController.create);
router.post('/autopay/manage', authorize(UserRole.OWNER), AutoPayController.manage);

export default router;
