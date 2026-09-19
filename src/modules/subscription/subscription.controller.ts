import { Request, Response, NextFunction } from 'express';
import { SystemSettings } from '../settings/system-settings.model';
import { SubscriptionPayment, PaymentStatus } from './subscription-payment.model';
import { Restaurant, SubscriptionStatus } from '../restaurants/restaurant.model';
import { GatewayFactory } from './gateway.factory';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../../shared/errors/AppError';
import { env } from '../../config/env';

export class SubscriptionController {
  static async getSubscriptionPrice(req: Request, res: Response, next: NextFunction) {
    try {
      const setting = await SystemSettings.findOne({ key: 'subscriptionMonthlyPrice' });
      const amount = setting ? setting.value : 5000; // default ₹5000
      res.status(200).json({ success: true, data: { amount } });
    } catch (error) {
      next(error);
    }
  }

  static async createPaymentOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const restaurantId = req.user?.restaurantId;
      if (!restaurantId) return res.status(400).json({ success: false, message: 'Restaurant ID missing' });

      const restaurant = await Restaurant.findById(restaurantId).populate('ownerId');
      if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found' });

      const owner: any = restaurant.ownerId; // User model

      const setting = await SystemSettings.findOne({ key: 'subscriptionMonthlyPrice' });
      const amount = setting ? setting.value : 5000;

      const orderId = `SUB_${restaurantId}_${Date.now()}_${uuidv4().substring(0, 4)}`;

      const gateway = GatewayFactory.getGateway();

      const { paymentSessionId, gatewayOrderId } = await gateway.createOrder({
        orderId,
        amount,
        currency: 'INR',
        customerDetails: {
          customerId: owner ? owner._id.toString() : restaurantId.toString(),
          customerPhone: owner?.phone || restaurant.phone,
          customerEmail: owner?.email || restaurant.email,
          customerName: owner?.name || restaurant.name,
        },
      });

      const payment = new SubscriptionPayment({
        restaurantId,
        orderId: gatewayOrderId,
        paymentSessionId,
        amount,
        currency: 'INR',
        status: PaymentStatus.CREATED,
        gateway: env.NODE_ENV === 'production' ? 'cashfree' : 'mock',
      });
      await payment.save();

      res.status(200).json({
        success: true,
        data: {
          paymentSessionId,
          orderId: gatewayOrderId,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async verifyPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const restaurantId = req.user?.restaurantId;
      const { orderId } = req.body;

      if (!restaurantId) return res.status(400).json({ success: false, message: 'Restaurant ID missing' });
      if (!orderId) return res.status(400).json({ success: false, message: 'Order ID missing' });

      const payment = await SubscriptionPayment.findOne({ orderId, restaurantId });
      if (!payment) return res.status(404).json({ success: false, message: 'Payment record not found' });

      if (payment.status === PaymentStatus.PAID) {
        return res.status(200).json({ success: true, data: { status: 'PAID' } });
      }

      const gateway = GatewayFactory.getGateway();
      const status = await gateway.verifyPayment(orderId);

      if (status === 'PAID') {
        payment.status = PaymentStatus.PAID;
        payment.paidAt = new Date();
        
        const restaurant = await Restaurant.findById(restaurantId);
        if (restaurant) {
          restaurant.subscriptionStatus = SubscriptionStatus.ACTIVE;
          
          let expiresAt = new Date();
          // If already active and has expiry in the future, extend it
          if (restaurant.subscriptionExpiresAt && restaurant.subscriptionExpiresAt > new Date()) {
             expiresAt = new Date(restaurant.subscriptionExpiresAt);
          }
          expiresAt.setDate(expiresAt.getDate() + 30); // 30 days subscription
          
          restaurant.subscriptionExpiresAt = expiresAt;
          await restaurant.save();

          payment.expiresAt = expiresAt;
        }

        await payment.save();
      } else if (status === 'FAILED' || status === 'EXPIRED') {
        payment.status = status as PaymentStatus;
        await payment.save();
      }

      res.status(200).json({ success: true, data: { status } });
    } catch (error) {
      next(error);
    }
  }

  static async getPaymentHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const restaurantId = req.user?.restaurantId;
      if (!restaurantId) return res.status(400).json({ success: false, message: 'Restaurant ID missing' });

      const history = await SubscriptionPayment.find({ restaurantId }).sort({ createdAt: -1 });
      res.status(200).json({ success: true, data: history });
    } catch (error) {
      next(error);
    }
  }

  static async handleWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      // Cashfree webhook signature verification
      const signature = req.headers['x-webhook-signature'] as string;
      const timestamp = req.headers['x-webhook-timestamp'] as string;
      
      if (!signature || !timestamp) {
        return res.status(400).send('Missing signature');
      }

      const gateway = GatewayFactory.getGateway();
      // Cashfree requires the raw body string for signature verification
      const rawBody = (req as any).rawBody || JSON.stringify(req.body);

      const isValid = gateway.verifyWebhookSignature(signature, rawBody, timestamp);
      
      if (!isValid) {
        return res.status(400).send('Invalid signature');
      }

      const payload = req.body;
      const orderId = payload?.data?.order?.order_id;
      
      if (!orderId) {
        return res.status(200).send('OK'); // Ignore if no order ID
      }

      const payment = await SubscriptionPayment.findOne({ orderId });
      if (!payment) {
        return res.status(200).send('OK'); // Order not found, ignore
      }

      // If already paid, ignore
      if (payment.status === PaymentStatus.PAID) {
        return res.status(200).send('OK');
      }

      // Fallback verification just to be completely safe
      const status = await gateway.verifyPayment(orderId);
      
      if (status === 'PAID') {
        payment.status = PaymentStatus.PAID;
        payment.paidAt = new Date();
        
        const restaurant = await Restaurant.findById(payment.restaurantId);
        if (restaurant) {
          restaurant.subscriptionStatus = SubscriptionStatus.ACTIVE;
          
          let expiresAt = new Date();
          if (restaurant.subscriptionExpiresAt && restaurant.subscriptionExpiresAt > new Date()) {
             expiresAt = new Date(restaurant.subscriptionExpiresAt);
          }
          expiresAt.setDate(expiresAt.getDate() + 30);
          
          restaurant.subscriptionExpiresAt = expiresAt;
          await restaurant.save();

          payment.expiresAt = expiresAt;
        }

        await payment.save();
      }

      res.status(200).send('OK');
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).send('Internal Server Error');
    }
  }
}
