import { Types } from 'mongoose';
import { SystemSettings } from '../../settings/system-settings.model';
import { Restaurant, SubscriptionStatus } from '../../restaurants/restaurant.model';
import {
  MandateStatus,
  RestaurantSubscription,
  RestaurantSubscriptionStatus,
  SubscriptionPaymentMode,
} from '../models/restaurant-subscription.model';

const DEFAULT_SUBSCRIPTION_PRICE = 5000;

export class SubscriptionService {
  static async getDefaultAmount(): Promise<number> {
    const setting = await SystemSettings.findOne({ key: 'subscriptionMonthlyPrice' }).lean();
    const amount = Number(setting?.value);
    return Number.isFinite(amount) && amount >= 100 ? amount : DEFAULT_SUBSCRIPTION_PRICE;
  }

  static async ensureSubscription(restaurantId: string | Types.ObjectId) {
    const defaultAmount = await this.getDefaultAmount();
    return RestaurantSubscription.findOneAndUpdate(
      { restaurantId },
      {
        $setOnInsert: {
          restaurantId,
          amount: defaultAmount,
          currency: 'INR',
          usesDefaultPrice: true,
          intervalCount: 1,
          intervalType: 'MONTH',
          status: RestaurantSubscriptionStatus.PENDING,
          paymentMode: SubscriptionPaymentMode.NORMAL,
          mandateStatus: MandateStatus.NOT_ENABLED,
          accessEnabled: true,
        },
      },
      { upsert: true, new: true }
    );
  }

  static async getChargeAmount(subscription: Awaited<ReturnType<typeof this.ensureSubscription>>) {
    if (subscription.pendingAmount !== undefined) return subscription.pendingAmount;
    if (subscription.usesDefaultPrice) return this.getDefaultAmount();
    return subscription.amount;
  }

  static async syncRestaurantAccess(subscription: any) {
    const now = new Date();
    const active = subscription.accessEnabled &&
      subscription.status === RestaurantSubscriptionStatus.ACTIVE &&
      !!subscription.currentPeriodEnd &&
      subscription.currentPeriodEnd > now;

    const restaurantStatus = active ? SubscriptionStatus.ACTIVE :
      subscription.status === RestaurantSubscriptionStatus.PENDING ? SubscriptionStatus.PENDING : SubscriptionStatus.EXPIRED;

    await Restaurant.findByIdAndUpdate(subscription.restaurantId, {
      $set: {
        subscriptionStatus: restaurantStatus,
        subscriptionExpiresAt: subscription.currentPeriodEnd,
      },
    });

    return active;
  }

  static async applySuccessfulPayment(subscriptionId: Types.ObjectId | string, amount: number) {
    const subscription = await RestaurantSubscription.findById(subscriptionId);
    if (!subscription) return null;

    const now = new Date();
    const periodStart = subscription.currentPeriodEnd && subscription.currentPeriodEnd > now
      ? subscription.currentPeriodEnd
      : now;
    const periodEnd = new Date(periodStart);
    if (subscription.intervalType === 'YEAR') {
      periodEnd.setFullYear(periodEnd.getFullYear() + subscription.intervalCount);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + subscription.intervalCount);
    }

    subscription.amount = amount;
    subscription.pendingAmount = undefined;
    subscription.pendingAmountEffectiveAt = undefined;
    subscription.status = RestaurantSubscriptionStatus.ACTIVE;
    subscription.currentPeriodStart = periodStart;
    subscription.currentPeriodEnd = periodEnd;
    subscription.nextChargeAt = periodEnd;
    subscription.chargeProcessing = false;
    subscription.lastPaymentId = undefined;
    subscription.failureReason = undefined;
    await subscription.save();
    await this.syncRestaurantAccess(subscription);
    return subscription;
  }

  static async markExpiredSubscriptions() {
    const now = new Date();
    const expired = await RestaurantSubscription.find({
      accessEnabled: true,
      status: RestaurantSubscriptionStatus.ACTIVE,
      currentPeriodEnd: { $lte: now },
    });

    for (const subscription of expired) {
      subscription.status = RestaurantSubscriptionStatus.EXPIRED;
      await subscription.save();
      await this.syncRestaurantAccess(subscription);
    }

    return expired.length;
  }

  static async getAccess(restaurantId: string | Types.ObjectId) {
    const subscription = await this.ensureSubscription(restaurantId);
    const active = await this.syncRestaurantAccess(subscription);
    return {
      active,
      status: subscription.status,
      paymentMode: subscription.paymentMode,
      mandateStatus: subscription.mandateStatus,
      currentPeriodEnd: subscription.currentPeriodEnd,
      amount: await this.getChargeAmount(subscription),
      dashboard: true,
      orders: active,
      billing: active,
      kds: active,
      inventory: active,
      recipes: active,
      reports: active,
    };
  }
}
