declare namespace Express {
  export interface Request {
    id?: string;
    tenantId?: string;
    user?: {
      userId: string;
      restaurantId?: string;
      role: string;
    };
  }
}
