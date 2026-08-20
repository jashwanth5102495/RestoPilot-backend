import { Request, Response, NextFunction } from 'express';
import { Order } from './order.model';

export class OrderController {
  static async getOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const orders = await Order.find({ restaurantId: req.tenantId })
        .sort({ createdAt: -1 })
        .lean();

      res.status(200).json({
        success: true,
        data: orders
      });
    } catch (error) {
      next(error);
    }
  }
}
