import { CreateOrderParams, PaymentGateway } from './payment-gateway.interface';

export class MockGateway implements PaymentGateway {
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
}
