import { Request, Response, NextFunction } from 'express';
import { Order } from './order.model';

export class OrderController {
  static async getOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const { source, limit, status, since } = req.query;
      const query: any = { restaurantId: req.tenantId };
      
      if (source) query.orderSource = source;
      if (status) query.orderStatus = status;
      if (since) query.createdAt = { $gt: new Date(since as string) };

      let q = Order.find(query).sort({ createdAt: -1 });
      if (limit) q = q.limit(parseInt(limit as string, 10));

      const orders = await q.lean();

      res.status(200).json({
        success: true,
        data: orders
      });
    } catch (error) {
      next(error);
    }
  }
}
