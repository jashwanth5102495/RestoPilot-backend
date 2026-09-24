export type AutopayAction = 'CANCEL' | 'PAUSE' | 'ACTIVATE';

export interface CreatePlanParams {
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  intervalCount: number;
  intervalType: 'MONTH' | 'YEAR';
}

export interface CreateSubscriptionParams {
  subscriptionId: string;
  planId: string;
  customerDetails: {
    customerId: string;
    customerPhone: string;
    customerEmail?: string;
    customerName?: string;
  };
  returnUrl: string;
  firstChargeTime?: string;
}

export interface CreateSubscriptionResult {
  subscriptionId: string;
  subscriptionSessionId: string;
  status?: string;
}

export interface SubscriptionResult {
  subscriptionId: string;
  status: string;
  authorizationStatus?: string;
  nextChargeAt?: string;
  raw: Record<string, unknown>;
}

export interface RaiseChargeParams {
  subscriptionId: string;
  paymentId: string;
  amount: number;
  paymentType?: 'AUTH' | 'CHARGE';
  scheduleDate?: string;
}

export interface SubscriptionPaymentResult {
  subscriptionId: string;
  paymentId: string;
  status: string;
  amount?: number;
  raw: Record<string, unknown>;
}

export interface CreateRefundParams {
  orderId?: string;
  subscriptionId?: string;
  refundId: string;
  amount: number;
  note?: string;
  speed?: 'STANDARD' | 'INSTANT';
}

export interface RefundResult {
  orderId?: string;
  refundId: string;
  status: string;
  amount: number;
  cashfreeRefundId?: string;
  refundArn?: string;
  raw: Record<string, unknown>;
}

export interface AutoPayGateway {
  createPlan(params: CreatePlanParams): Promise<{ planId: string }>;
  createSubscription(params: CreateSubscriptionParams): Promise<CreateSubscriptionResult>;
  getSubscription(subscriptionId: string): Promise<SubscriptionResult>;
  manageSubscription(subscriptionId: string, action: AutopayAction | 'CHANGE_PLAN', planId?: string): Promise<SubscriptionResult>;
  raiseCharge(params: RaiseChargeParams): Promise<SubscriptionPaymentResult>;
  getSubscriptionPayment(subscriptionId: string, paymentId: string): Promise<SubscriptionPaymentResult>;
  createRefund(params: CreateRefundParams): Promise<RefundResult>;
  getRefund(orderId: string, refundId: string): Promise<RefundResult>;
}
