import cron from 'node-cron';
import { v4 as uuidv4 } from 'uuid';
import { GatewayFactory } from '../gateways/gateway.factory';
import { AutoPayGateway } from '../contracts/autopay-gateway.interface';
import { RestaurantSubscription, MandateStatus, RestaurantSubscriptionStatus } from '../models/restaurant-subscription.model';
import { PaymentStatus, SubscriptionPayment, SubscriptionPaymentType } from '../models/subscription-payment.model';
import { SubscriptionService } from '../services/subscription.service';
import { env } from '../../../config/env';

class AutopayCronService {
  start() {
    cron.schedule('*/5 * * * *', () => this.processDueCharges().catch(error => console.error('Autopay charge job failed:', error)));
    cron.schedule('0 * * * *', () => SubscriptionService.markExpiredSubscriptions().catch(error => console.error('Subscription expiry job failed:', error)));
    console.log('Autopay and subscription expiry jobs scheduled.');
  }

  private async processDueCharges() {
    const now = new Date();
    const gateway = GatewayFactory.getGateway() as unknown as AutoPayGateway;

    while (true) {
      const subscription = await RestaurantSubscription.findOneAndUpdate(
        {
          status: RestaurantSubscriptionStatus.ACTIVE,
          mandateStatus: MandateStatus.ACTIVE,
          accessEnabled: true,
          cashfreeSubscriptionId: { $exists: true, $ne: null },
          nextChargeAt: { $lte: now },
          chargeProcessing: { $ne: true },
        },
        {
          $set: { chargeProcessing: true, lastChargeAttemptAt: now },
        },
        { new: true }
      );

      if (!subscription) break;

      let payment: any;
      try {
        const paymentId = `CHG_${subscription._id}_${Date.now()}_${uuidv4().slice(0, 6)}`;
        const amount = await SubscriptionService.getChargeAmount(subscription);
        const planId = `rp_${subscription.restaurantId}_${amount}_${subscription.intervalType.toLowerCase()}`;
        if (subscription.cashfreePlanId !== planId) {
          const plan = await gateway.createPlan({
            planId,
            planName: `RestoPilot ${amount} ${subscription.intervalType}`,
            amount,
            currency: subscription.currency,
            intervalCount: subscription.intervalCount,
            intervalType: subscription.intervalType,
          });
          await gateway.manageSubscription(subscription.cashfreeSubscriptionId!, 'CHANGE_PLAN', plan.planId);
          subscription.cashfreePlanId = plan.planId;
          await subscription.save();
        }

        payment = await SubscriptionPayment.create({
          restaurantId: subscription.restaurantId,
          subscriptionId: subscription.cashfreeSubscriptionId,
          orderId: `AUTOPAY_${paymentId}`,
          paymentId,
          amount,
          currency: subscription.currency,
          paymentType: SubscriptionPaymentType.CHARGE,
          status: PaymentStatus.PENDING,
          gateway: env.NODE_ENV === 'production' ? 'cashfree' : 'mock',
        });

        const result = await gateway.raiseCharge({
          subscriptionId: subscription.cashfreeSubscriptionId!,
          paymentId,
          amount,
          paymentType: 'CHARGE',
        });

        payment.gatewayResponse = result.raw;
        if (result.status === 'SUCCESS' || result.status === 'PAID') {
          payment.status = PaymentStatus.PAID;
          payment.paidAt = new Date();
          const updated = await SubscriptionService.applySuccessfulPayment(subscription._id, amount);
          payment.expiresAt = updated?.currentPeriodEnd;
          payment.periodStart = updated?.currentPeriodStart;
          payment.periodEnd = updated?.currentPeriodEnd;
        } else {
          payment.status = PaymentStatus.PENDING;
          subscription.nextChargeAt = new Date(Date.now() + 60 * 60 * 1000);
          subscription.chargeProcessing = false;
          subscription.lastPaymentId = paymentId;
          await subscription.save();
        }
        await payment.save();
      } catch (error: any) {
        if (payment) {
          payment.status = PaymentStatus.FAILED;
          payment.failureReason = error?.message || 'Unable to raise recurring charge';
          await payment.save();
        }
        subscription.chargeProcessing = false;
        subscription.failureReason = error?.message || 'Unable to raise recurring charge';
        subscription.nextChargeAt = new Date(Date.now() + 60 * 60 * 1000);
        await subscription.save();
      }
    }
  }
}

export default new AutopayCronService();
