import { Cashfree, CFEnvironment } from 'cashfree-pg';
import { CreateOrderParams, PaymentGateway } from './payment-gateway.interface';
import {
  AutoPayGateway,
  AutopayAction,
  CreatePlanParams,
  CreateRefundParams,
  CreateSubscriptionParams,
  RaiseChargeParams,
} from './autopay-gateway.interface';
import { env } from '../../config/env';
import { AppError } from '../../shared/errors/AppError';

export class CashfreeGateway implements PaymentGateway, AutoPayGateway {
  private cashfree: Cashfree;
  private baseUrl: string;
  private appId: string;
  private secretKey: string;

  constructor() {
    const cashfreeEnvironment = env.CASHFREE_ENV || (env.NODE_ENV === 'production' ? 'production' : 'sandbox');
    const isProduction = cashfreeEnvironment === 'production';
    const environment = isProduction ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX;
    const appId = isProduction ? env.CASHFREE_APP_ID : env.CASHFREE_APP_ID_TEST;
    const secretKey = isProduction ? env.CASHFREE_SECRET_KEY : env.CASHFREE_SECRET_KEY_TEST;

    if (!appId || !secretKey) {
      throw new AppError('Cashfree credentials missing in environment variables', 500);
    }

    this.cashfree = new Cashfree(environment, appId, secretKey);
    this.baseUrl = isProduction ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg';
    this.appId = appId;
    this.secretKey = secretKey;
    // Pin to v5 API contract as per Cashfree backend SDK skill guidelines
    this.cashfree.XApiVersion = "2025-01-01";
  }

  async createOrder(params: CreateOrderParams): Promise<{ paymentSessionId: string; gatewayOrderId: string }> {
    const request = {
      order_amount: params.amount,
      order_currency: params.currency,
      order_id: params.orderId,
      customer_details: {
        customer_id: params.customerDetails.customerId,
        customer_phone: params.customerDetails.customerPhone || '9999999999',
        customer_email: params.customerDetails.customerEmail,
        customer_name: params.customerDetails.customerName,
      },
      order_meta: {
        return_url: params.returnUrl,
      },
    };

    try {
      const response = await this.cashfree.PGCreateOrder(request);
      
      if (!response.data || !response.data.payment_session_id) {
        throw new Error('Invalid response from Cashfree');
      }

      return {
        paymentSessionId: response.data.payment_session_id,
        gatewayOrderId: response.data.order_id || params.orderId,
      };
    } catch (error: any) {
      throw new AppError(error.response?.data?.message || 'Cashfree order creation failed', 500);
    }
  }

  async verifyPayment(orderId: string): Promise<string> {
    try {
      const response = await this.cashfree.PGFetchOrder(orderId);
      return response.data?.order_status || 'FAILED';
    } catch (error: any) {
      throw new AppError(error.response?.data?.message || 'Cashfree verification failed', 500);
    }
  }

  verifyWebhookSignature(signature: string, rawBody: string, timestamp: string): boolean {
    try {
      this.cashfree.PGVerifyWebhookSignature(signature, rawBody, timestamp);
      return true;
    } catch (error) {
      return false;
    }
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': '2025-01-01',
        'x-client-id': this.appId,
        'x-client-secret': this.secretKey,
        ...(init.headers || {}),
      },
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = (body as any)?.message || (body as any)?.type || 'Cashfree request failed';
      throw new AppError(message, response.status >= 400 && response.status < 500 ? response.status : 502);
    }

    return body as T;
  }

  async createPlan(params: CreatePlanParams): Promise<{ planId: string }> {
    const response = await this.request<{ plan_id?: string }>('/plans', {
      method: 'POST',
      body: JSON.stringify({
        plan_id: params.planId,
        plan_name: params.planName,
        plan_type: 'PERIODIC',
        plan_currency: params.currency,
        plan_max_amount: params.amount,
        plan_recurring_amount: params.amount,
        plan_intervals: params.intervalCount,
        plan_interval_type: params.intervalType,
      }),
    });

    return { planId: response.plan_id || params.planId };
  }

  async createSubscription(params: CreateSubscriptionParams) {
    const response = await this.request<any>('/subscriptions', {
      method: 'POST',
      body: JSON.stringify({
        subscription_id: params.subscriptionId,
        customer_details: {
          customer_id: params.customerDetails.customerId,
          customer_phone: params.customerDetails.customerPhone,
          customer_email: params.customerDetails.customerEmail,
          customer_name: params.customerDetails.customerName,
        },
        plan_details: { plan_id: params.planId },
        subscription_meta: { return_url: params.returnUrl },
        subscription_first_charge_time: params.firstChargeTime,
      }),
    });

    return {
      subscriptionId: response.subscription_id || params.subscriptionId,
      subscriptionSessionId: response.subscription_session_id,
      status: response.subscription_status,
    };
  }

  async getSubscription(subscriptionId: string) {
    const response = await this.request<any>(`/subscriptions/${encodeURIComponent(subscriptionId)}`, { method: 'GET' });
    return {
      subscriptionId,
      status: response.subscription_status || response.status || 'UNKNOWN',
      authorizationStatus: response.authorization_details?.authorization_status,
      nextChargeAt: response.next_charge_at,
      raw: response,
    };
  }

  async manageSubscription(subscriptionId: string, action: AutopayAction | 'CHANGE_PLAN', planId?: string) {
    const response = await this.request<any>(`/subscriptions/${encodeURIComponent(subscriptionId)}/manage`, {
      method: 'POST',
      body: JSON.stringify({ action, ...(planId ? { plan_id: planId } : {}) }),
    });
    return {
      subscriptionId,
      status: response.subscription_status || response.status || action,
      authorizationStatus: response.authorization_details?.authorization_status,
      nextChargeAt: response.next_charge_at,
      raw: response,
    };
  }

  async raiseCharge(params: RaiseChargeParams) {
    const response = await this.request<any>('/subscriptions/pay', {
      method: 'POST',
      body: JSON.stringify({
        subscription_id: params.subscriptionId,
        payment_id: params.paymentId,
        payment_type: params.paymentType || 'CHARGE',
        payment_amount: params.amount,
        payment_schedule_date: params.scheduleDate,
      }),
    });
    return {
      subscriptionId: params.subscriptionId,
      paymentId: params.paymentId,
      status: response.payment_status || response.status || 'INITIALIZED',
      amount: response.payment_amount || params.amount,
      raw: response,
    };
  }

  async getSubscriptionPayment(subscriptionId: string, paymentId: string) {
    const response = await this.request<any>(
      `/subscriptions/${encodeURIComponent(subscriptionId)}/payments/${encodeURIComponent(paymentId)}`,
      { method: 'GET' }
    );
    return {
      subscriptionId,
      paymentId,
      status: response.payment_status || response.status || 'UNKNOWN',
      amount: response.payment_amount,
      raw: response,
    };
  }

  async createRefund(params: CreateRefundParams) {
    const resourcePath = params.subscriptionId
      ? `/subscriptions/${encodeURIComponent(params.subscriptionId)}/refunds`
      : `/orders/${encodeURIComponent(params.orderId!)}/refunds`;
    const response = await this.request<any>(resourcePath, {
      method: 'POST',
      body: JSON.stringify({
        refund_id: params.refundId,
        refund_amount: params.amount,
        refund_note: params.note,
        refund_speed: params.speed || 'STANDARD',
      }),
    });
    return this.mapRefund(response, params.orderId, params.refundId, params.amount);
  }

  async getRefund(orderId: string, refundId: string) {
    const response = await this.request<any>(
      `/orders/${encodeURIComponent(orderId)}/refunds/${encodeURIComponent(refundId)}`,
      { method: 'GET' }
    );
    return this.mapRefund(response, orderId, refundId, response.refund_amount || 0);
  }

  private mapRefund(response: any, orderId: string | undefined, refundId: string, amount: number) {
    return {
      orderId,
      refundId: response.refund_id || refundId,
      status: response.refund_status || 'PENDING',
      amount: response.refund_amount || amount,
      cashfreeRefundId: response.cf_refund_id?.toString(),
      refundArn: response.refund_arn,
      raw: response,
    };
  }
}
