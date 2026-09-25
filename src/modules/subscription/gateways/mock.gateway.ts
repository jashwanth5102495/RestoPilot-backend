import { CreateOrderParams, PaymentGateway } from '../contracts/payment-gateway.interface';
import { AutoPayGateway } from '../contracts/autopay-gateway.interface';

export class MockGateway implements PaymentGateway, AutoPayGateway {
  async createOrder(params: CreateOrderParams): Promise<{ paymentSessionId: string; gatewayOrderId: string }> {
    return {
      paymentSessionId: `mock_session_${Date.now()}`,
      gatewayOrderId: params.orderId,
    };
  }

  async verifyPayment(orderId: string): Promise<string> {
    // In mock mode, we assume the payment always succeeds instantly
    return 'PAID';
  }

  verifyWebhookSignature(signature: string, rawBody: string, timestamp: string): boolean {
    return true; // Always valid in mock
  }

  async createPlan(params: { planId: string }): Promise<{ planId: string }> {
    return { planId: params.planId };
  }

  async createSubscription(params: any) {
    return {
      subscriptionId: params.subscriptionId,
      subscriptionSessionId: `mock_subscription_session_${Date.now()}`,
      status: 'INITIALIZED',
    };
  }

  async getSubscription(subscriptionId: string) {
    return { subscriptionId, status: 'ACTIVE', raw: {} };
  }

  async manageSubscription(subscriptionId: string, action: 'CANCEL' | 'PAUSE' | 'ACTIVATE' | 'CHANGE_PLAN') {
    return { subscriptionId, status: action === 'ACTIVATE' ? 'ACTIVE' : action, raw: {} };
  }

  async raiseCharge(params: any) {
    return {
      subscriptionId: params.subscriptionId,
      paymentId: params.paymentId,
      status: 'SUCCESS',
      amount: params.amount,
      raw: {},
    };
  }

  async getSubscriptionPayment(subscriptionId: string, paymentId: string) {
    return { subscriptionId, paymentId, status: 'SUCCESS', raw: {} };
  }

  async createRefund(params: any) {
    return {
      orderId: params.orderId,
      refundId: params.refundId,
      status: 'SUCCESS',
      amount: params.amount,
      raw: {},
    };
  }

  async getRefund(orderId: string, refundId: string) {
    return { orderId, refundId, status: 'SUCCESS', amount: 0, raw: {} };
  }
}
