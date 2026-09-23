import { Cashfree, CFEnvironment } from 'cashfree-pg';
import { CreateOrderParams, PaymentGateway } from './payment-gateway.interface';
import { env } from '../../config/env';
import { AppError } from '../../shared/errors/AppError';

export class CashfreeGateway implements PaymentGateway {
  private cashfree: Cashfree;

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
}
