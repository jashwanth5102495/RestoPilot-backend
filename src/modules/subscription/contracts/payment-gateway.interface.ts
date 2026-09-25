export interface CreateOrderParams {
  orderId: string;
  amount: number;
  currency: string;
  customerDetails: {
    customerId: string;
    customerPhone: string;
    customerEmail?: string;
    customerName?: string;
  };
  returnUrl?: string;
}

export interface PaymentGateway {
  /**
   * Creates an order with the payment gateway
   * @returns The session ID to pass to the frontend for checkout and the gateway's internal order ID
   */
  createOrder(params: CreateOrderParams): Promise<{ paymentSessionId: string; gatewayOrderId: string }>;
  
  /**
   * Verifies the payment status of an order
   * @returns Status like 'PAID', 'ACTIVE', 'EXPIRED', 'FAILED'
   */
  verifyPayment(orderId: string): Promise<string>;
  
  /**
   * Verifies the webhook signature sent by the gateway
   */
  verifyWebhookSignature(signature: string, rawBody: string, timestamp: string): boolean;
}
