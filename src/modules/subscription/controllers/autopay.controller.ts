import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Restaurant } from '../../restaurants/restaurant.model';
import { SubscriptionPayment, PaymentStatus, SubscriptionPaymentType } from '../models/subscription-payment.model';
import {
  MandateStatus,
  RestaurantSubscription,
  RestaurantSubscriptionStatus,
  SubscriptionPaymentMode,
} from '../models/restaurant-subscription.model';
import { AutoPayGateway } from '../contracts/autopay-gateway.interface';
import { GatewayFactory } from '../gateways/gateway.factory';
import { SubscriptionService } from '../services/subscription.service';
import { AppError } from '../../../shared/errors/AppError';
import { env } from '../../../config/env';

const getAutoPayGateway = () => GatewayFactory.getGateway() as PaymentGatewayWithAutopay;

type PaymentGatewayWithAutopay = ReturnType<typeof GatewayFactory.getGateway> & AutoPayGateway;

export class AutoPayController {
  static async getStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const restaurantId = req.user?.restaurantId;
      if (!restaurantId) return res.status(400).json({ success: false, message: 'Restaurant ID missing' });
      const subscription = await SubscriptionService.ensureSubscription(restaurantId);
      const access = await SubscriptionService.getAccess(restaurantId);
      res.json({ success: true, data: { subscription, access } });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const restaurantId = req.user?.restaurantId;
      if (!restaurantId) return res.status(400).json({ success: false, message: 'Restaurant ID missing' });

      const subscription = await SubscriptionService.ensureSubscription(restaurantId);
      if (subscription.mandateStatus === MandateStatus.ACTIVE && subscription.cashfreeSubscriptionId) {
        return res.json({ success: true, data: { subscription, alreadyActive: true } });
      }

      const restaurant = await Restaurant.findById(restaurantId).populate('ownerId');
      if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found' });
      const owner: any = restaurant.ownerId;
      const amount = await SubscriptionService.getChargeAmount(subscription);
      const gateway = getAutoPayGateway();
      const planId = `rp_${restaurantId}_${amount}_${subscription.intervalType.toLowerCase()}`;
      const plan = await gateway.createPlan({
        planId,
        planName: `RestoPilot ${amount} ${subscription.intervalType}`,
        amount,
        currency: subscription.currency,
        intervalCount: subscription.intervalCount,
        intervalType: subscription.intervalType,
      });

      const cashfreeSubscriptionId = `SUB_${restaurantId}_${Date.now()}_${uuidv4().slice(0, 8)}`;
      const created = await gateway.createSubscription({
        subscriptionId: cashfreeSubscriptionId,
        planId: plan.planId,
        customerDetails: {
          customerId: owner?._id?.toString() || restaurantId.toString(),
          customerPhone: owner?.phone || restaurant.phone,
          customerEmail: owner?.email || restaurant.email,
          customerName: owner?.name || restaurant.name,
        },
        returnUrl: `${env.FRONTEND_URL}/subscription?autopay=return`,
      });

      subscription.paymentMode = SubscriptionPaymentMode.AUTOPAY;
      subscription.mandateStatus = MandateStatus.AUTHORIZATION_PENDING;
      subscription.cashfreePlanId = plan.planId;
      subscription.cashfreeSubscriptionId = created.subscriptionId;
      await subscription.save();

      await SubscriptionPayment.create({
        restaurantId,
        subscriptionId: created.subscriptionId,
        orderId: `AUTH_${created.subscriptionId}`,
        paymentId: `AUTH_${created.subscriptionId}`,
        amount,
        currency: subscription.currency,
        paymentType: SubscriptionPaymentType.AUTH,
        status: PaymentStatus.CREATED,
        gateway: env.NODE_ENV === 'production' ? 'cashfree' : 'mock',
      });

      res.status(201).json({
        success: true,
        data: {
          subscriptionId: created.subscriptionId,
          subscriptionSessionId: created.subscriptionSessionId,
          status: subscription.mandateStatus,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async manage(req: Request, res: Response, next: NextFunction) {
    try {
      const restaurantId = req.user?.restaurantId;
      const action = req.body?.action as 'CANCEL' | 'PAUSE' | 'ACTIVATE';
      if (!restaurantId) return res.status(400).json({ success: false, message: 'Restaurant ID missing' });
      if (!['CANCEL', 'PAUSE', 'ACTIVATE'].includes(action)) {
        return res.status(400).json({ success: false, message: 'Invalid Autopay action' });
      }

      const subscription = await SubscriptionService.ensureSubscription(restaurantId);
      if (!subscription.cashfreeSubscriptionId) {
        return res.status(400).json({ success: false, message: 'Autopay is not configured' });
      }

      const gateway = getAutoPayGateway();
      const result = await gateway.manageSubscription(subscription.cashfreeSubscriptionId, action);
      if (action === 'CANCEL' || action === 'PAUSE') {
        subscription.mandateStatus = MandateStatus.CANCELLED;
        subscription.paymentMode = SubscriptionPaymentMode.NORMAL;
        subscription.cancelledAt = new Date();
      } else {
        subscription.mandateStatus = MandateStatus.ACTIVE;
        subscription.paymentMode = SubscriptionPaymentMode.AUTOPAY;
        subscription.cancelledAt = undefined;
      }
      await subscription.save();
      res.json({ success: true, data: { subscription, gatewayStatus: result.status } });
    } catch (error) {
      next(error);
    }
  }

  static async adminList(req: Request, res: Response, next: NextFunction) {
    try {
      const restaurants = await Restaurant.find().select('_id');
      await Promise.all(restaurants.map(restaurant => SubscriptionService.ensureSubscription(restaurant._id)));
      const subscriptions = await RestaurantSubscription.find()
        .populate('restaurantId', 'name email phone')
        .sort({ updatedAt: -1 });
      res.json({ success: true, data: subscriptions });
    } catch (error) {
      next(error);
    }
  }

  static async adminUpdate(req: Request, res: Response, next: NextFunction) {
    try {
      const restaurantId = String(req.params.restaurantId);
      const { amount, accessEnabled } = req.body;
      const subscription = await SubscriptionService.ensureSubscription(restaurantId);

      if (amount !== undefined && amount !== null) {
        const minimumAmount = await SubscriptionService.getMinimumAmount();
        if (typeof amount !== 'number' || amount < minimumAmount) {
          throw new AppError(`Subscription amount must be at least ${minimumAmount}`, 400);
        }
        if (subscription.currentPeriodEnd && subscription.currentPeriodEnd > new Date()) {
          subscription.pendingAmount = amount;
          subscription.pendingAmountEffectiveAt = subscription.currentPeriodEnd;
        } else {
          subscription.amount = amount;
          subscription.usesDefaultPrice = false;
          subscription.pendingAmount = undefined;
          subscription.pendingAmountEffectiveAt = undefined;
        }
        subscription.usesDefaultPrice = false;
      }

      if (accessEnabled !== undefined) {
        subscription.accessEnabled = Boolean(accessEnabled);
        if (!subscription.accessEnabled) {
          subscription.status = RestaurantSubscriptionStatus.ADMIN_DISABLED;
        } else if (subscription.status === RestaurantSubscriptionStatus.ADMIN_DISABLED) {
          subscription.status = subscription.currentPeriodEnd && subscription.currentPeriodEnd > new Date()
            ? RestaurantSubscriptionStatus.ACTIVE
            : RestaurantSubscriptionStatus.EXPIRED;
        }
      }

      await subscription.save();
      await SubscriptionService.syncRestaurantAccess(subscription);
      res.json({ success: true, data: subscription });
    } catch (error) {
      next(error);
    }
  }

  static async adminRefund(req: Request, res: Response, next: NextFunction) {
    try {
      const payment = await SubscriptionPayment.findById(req.params.paymentId);
      if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
      if (payment.status !== PaymentStatus.PAID) {
        return res.status(400).json({ success: false, message: 'Only paid payments can be refunded' });
      }

      const amount = Number(req.body?.amount || (payment.amount - payment.refundedAmount));
      const remaining = payment.amount - payment.refundedAmount;
      if (!Number.isFinite(amount) || amount <= 0 || amount > remaining) {
        return res.status(400).json({ success: false, message: 'Refund amount exceeds the remaining refundable amount' });
      }

      const refundId = `REF_${payment.orderId}_${Date.now()}`;
      const result = await getAutoPayGateway().createRefund({
        orderId: payment.orderId,
        subscriptionId: payment.subscriptionId,
        refundId,
        amount,
        note: req.body?.note,
        speed: req.body?.speed === 'INSTANT' ? 'INSTANT' : 'STANDARD',
      });

      payment.refundId = result.refundId;
      payment.refundStatus = result.status;
      payment.refundedAmount += result.status === 'SUCCESS' ? amount : 0;
      payment.refundArn = result.refundArn;
      payment.status = result.status === 'SUCCESS' ? PaymentStatus.REFUNDED : PaymentStatus.REFUND_PENDING;
      await payment.save();
      res.status(201).json({ success: true, data: { payment, refund: result } });
    } catch (error) {
      next(error);
    }
  }
}
