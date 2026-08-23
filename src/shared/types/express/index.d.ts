import { Types } from 'mongoose';
import { UserRole } from '../../modules/users/user.model';

declare global {
  namespace Express {
    export interface Request {
      id?: string;
      user?: {
        userId: string;
        restaurantId?: string;
        role: UserRole;
      };
      tenantId?: string; // Always stringified ObjectId
    }
  }
}
