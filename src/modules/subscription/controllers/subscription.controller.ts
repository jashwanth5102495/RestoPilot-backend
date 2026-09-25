import { Request, Response, NextFunction } from 'express';
import { SystemSettings } from '../../settings/system-settings.model';
import { SubscriptionPayment, PaymentStatus } from '../models/subscription-payment.model';
import { Restaurant, SubscriptionStatus } from '../../restaurants/restaurant.model';
import { GatewayFactory } from '../gateways/gateway.factory';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../../../shared/errors/AppError';
import { env } from '../../../config/env';
import { SubscriptionService } from '../services/subscription.service';
import { SubscriptionPaymentType } from '../models/subscription-payment.model';
import { SubscriptionWebhookEvent } from '../models/subscription-webhook-event.model';
import { MandateStatus, RestaurantSubscription, RestaurantSubscriptionStatus, SubscriptionPaymentMode } from '../models/restaurant-subscription.model';

export class SubscriptionController {
  static async getSubscriptionPrice(req: Request, res: Response, next: NextFunction) {
    try {
      const amount = await SubscriptionService.getDefaultAmount();
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

      const subscription = await SubscriptionService.ensureSubscription(restaurantId);
      const amount = await SubscriptionService.getChargeAmount(subscription);

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
        paymentType: SubscriptionPaymentType.NORMAL_PAYMENT,
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
        const claimedPayment = await SubscriptionPayment.findOneAndUpdate(
          { _id: payment._id, status: { $ne: PaymentStatus.PAID } },
          { $set: { status: PaymentStatus.PAID, paidAt: new Date() } },
          { new: true }
        );
        if (!claimedPayment) {
          return res.status(200).json({ success: true, data: { status: 'PAID' } });
        }
        
        const subscription = await SubscriptionService.ensureSubscription(restaurantId);
        const updatedSubscription = await SubscriptionService.applySuccessfulPayment(subscription._id, claimedPayment.amount);
        claimedPayment.expiresAt = updatedSubscription?.currentPeriodEnd;

        await claimedPayment.save();
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
    let webhookEventKey: string | undefined;
    try {
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

      const payload = req.body || {};
      const eventType = String(payload.type || payload.event || 'UNKNOWN');
      const data = payload.data || {};
      const orderId = data.order?.order_id || data.order_id;
      const subscriptionDetails = data.subscription_details || data.subscription || {};
      const authorizationDetails = data.authorization_details || {};
      const paymentDetails = data.payment_details || data.payment || {};
      const subscriptionId = data.subscription_id || subscriptionDetails.subscription_id || subscriptionDetails.cf_subscription_id;
      const paymentId = data.payment_id || paymentDetails.payment_id;
      const eventStatus = data.payment_status || paymentDetails.payment_status || data.authorization_status || authorizationDetails.authorization_status || data.subscription_status || subscriptionDetails.subscription_status || 'UNKNOWN';
      const eventKey = String(req.headers['x-idempotency-key'] || `${eventType}:${orderId || subscriptionId || 'unknown'}:${paymentId || eventStatus}`);
      webhookEventKey = eventKey;

      try {
        await SubscriptionWebhookEvent.create({
          eventKey,
          eventType,
          subscriptionId,
          paymentId,
          payload,
        });
      } catch (error: any) {
        if (error?.code === 11000) return res.status(200).send('OK');
        throw error;
      }

      if (eventType === 'SUBSCRIPTION_AUTH_STATUS' || eventType === 'SUBSCRIPTION_STATUS_CHANGED') {
        const subscription = subscriptionId
          ? await RestaurantSubscription.findOne({ cashfreeSubscriptionId: subscriptionId })
          : null;
        if (subscription) {
          if (eventType === 'SUBSCRIPTION_AUTH_STATUS') {
            subscription.mandateStatus = eventStatus === 'SUCCESS' ? MandateStatus.ACTIVE : MandateStatus.FAILED;
            subscription.paymentMode = eventStatus === 'SUCCESS' ? SubscriptionPaymentMode.AUTOPAY : SubscriptionPaymentMode.NORMAL;
            if (eventStatus !== 'SUCCESS') subscription.failureReason = data.authorization_details?.authorization_message || 'Autopay authorization failed';
          } else if (['CANCELLED', 'CUSTOMER_CANCELLED', 'EXPIRED'].includes(eventStatus)) {
            subscription.mandateStatus = MandateStatus.CANCELLED;
            subscription.paymentMode = SubscriptionPaymentMode.NORMAL;
          }
          await subscription.save();
        }
      }

      if (eventType === 'SUBSCRIPTION_PAYMENT_SUCCESS') {
        const subscription = subscriptionId
          ? await RestaurantSubscription.findOne({ cashfreeSubscriptionId: subscriptionId })
          : null;
        if (subscription) {
          const amount = Number(data.payment_amount || data.payment?.payment_amount || subscription.amount);
          const payment = await SubscriptionPayment.findOneAndUpdate(
            { paymentId: String(paymentId) },
            {
              $setOnInsert: {
                restaurantId: subscription.restaurantId,
                subscriptionId,
                orderId: `AUTOPAY_${paymentId}`,
                paymentId: String(paymentId),
                amount,
                currency: subscription.currency,
                paymentType: SubscriptionPaymentType.CHARGE,
                gateway: env.NODE_ENV === 'production' ? 'cashfree' : 'mock',
              },
              $set: { status: PaymentStatus.PAID, paidAt: new Date(), gatewayResponse: payload },
            },
            { upsert: true, new: true }
          );
          const updatedSubscription = await SubscriptionService.applySuccessfulPayment(subscription._id, amount);
          payment.expiresAt = updatedSubscription?.currentPeriodEnd;
          payment.periodStart = updatedSubscription?.currentPeriodStart;
          payment.periodEnd = updatedSubscription?.currentPeriodEnd;
          await payment.save();
        }
      }

      if (eventType === 'SUBSCRIPTION_PAYMENT_FAILED') {
        const subscription = subscriptionId
          ? await RestaurantSubscription.findOne({ cashfreeSubscriptionId: subscriptionId })
          : null;
        if (subscription) {
          subscription.failureReason = data.payment_message || data.payment?.payment_message || 'Recurring payment failed';
          if (!subscription.currentPeriodEnd || subscription.currentPeriodEnd <= new Date()) {
            subscription.status = RestaurantSubscriptionStatus.PAYMENT_FAILED;
            await subscription.save();
            await SubscriptionService.syncRestaurantAccess(subscription);
          } else {
            await subscription.save();
          }
        }
      }

      if (eventType === 'REFUND_STATUS_WEBHOOK') {
        const refund = data.refund || data;
        const payment = await SubscriptionPayment.findOne({
          $or: [{ refundId: refund.refund_id }, { orderId: refund.order_id }],
        });
        if (payment) {
          payment.refundStatus = refund.refund_status;
          payment.refundArn = refund.refund_arn;
          payment.gatewayResponse = payload;
          if (refund.refund_status === 'SUCCESS') {
            const refundAmount = Number(refund.refund_amount || 0);
            payment.refundedAmount = Math.min(payment.amount, Math.max(payment.refundedAmount, refundAmount));
            payment.status = payment.refundedAmount >= payment.amount ? PaymentStatus.REFUNDED : PaymentStatus.PAID;
          } else if (['FAILED', 'CANCELLED'].includes(refund.refund_status)) {
            payment.status = PaymentStatus.REFUND_FAILED;
          } else {
            payment.status = PaymentStatus.REFUND_PENDING;
          }
          await payment.save();
        }
      }

      if (orderId && eventType !== 'REFUND_STATUS_WEBHOOK' && !subscriptionId) {
        const payment = await SubscriptionPayment.findOne({ orderId });
        if (payment && payment.status !== PaymentStatus.PAID) {
          const status = await gateway.verifyPayment(orderId);
          if (status === 'PAID') {
            payment.status = PaymentStatus.PAID;
            payment.paidAt = new Date();
            const subscription = await SubscriptionService.ensureSubscription(payment.restaurantId);
            const updatedSubscription = await SubscriptionService.applySuccessfulPayment(subscription._id, payment.amount);
            payment.expiresAt = updatedSubscription?.currentPeriodEnd;
            await payment.save();
          } else if (status === 'FAILED' || status === 'EXPIRED') {
            payment.status = status as PaymentStatus;
            await payment.save();
          }
        }
      }

      res.status(200).send('OK');
    } catch (error) {
      console.error('Webhook error:', error);
      if (webhookEventKey) {
        await SubscriptionWebhookEvent.deleteOne({ eventKey: webhookEventKey }).catch(() => undefined);
      }
      res.status(500).send('Internal Server Error');
    }
  }
}
