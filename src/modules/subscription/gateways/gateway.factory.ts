import { PaymentGateway } from '../contracts/payment-gateway.interface';
import { CashfreeGateway } from './cashfree.gateway';
import { MockGateway } from './mock.gateway';
import { env } from '../../../config/env';

export class GatewayFactory {
  static getGateway(): PaymentGateway {
    if (env.NODE_ENV === 'development' || env.NODE_ENV === 'test') {
      return new MockGateway();
    }
    return new CashfreeGateway();
  }
}
