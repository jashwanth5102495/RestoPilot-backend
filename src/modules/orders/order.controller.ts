import { Request, Response, NextFunction } from 'express';
import { Order } from './order.model';
import { OrderService } from './order.service';

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

  static async startTableOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const { tableId } = req.body;
      const order = await OrderService.startTableOrder(req.tenantId!, tableId, (req as any).user.userId);
      res.json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  }

  static async updateOrderItems(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderId } = req.params;
      const { updates } = req.body;
      const order = await OrderService.updateOrderItems(req.tenantId!, orderId, updates, (req as any).user.userId);
      res.json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  }

  static async sendOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderId } = req.params;
      const order = await OrderService.sendOrder(req.tenantId!, orderId, (req as any).user.userId);
      res.json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  }

  static async updateOrderStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderId } = req.params;
      const { status } = req.body;
      const order = await OrderService.updateOrderStatus(req.tenantId!, orderId, status, (req as any).user.userId);
      res.json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  }
}
