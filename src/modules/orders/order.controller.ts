import { Request, Response, NextFunction } from 'express';
import { Order, OrderStatus, PaymentStatus, PaymentMethod } from './order.model';
import { OrderService } from './order.service';

export class OrderController {
  static async getOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const { source, limit, status, since, view } = req.query;
      const query: any = { restaurantId: req.tenantId };
      
      if (source) query.orderSource = source;
      if (status) query.orderStatus = status;
      if (since) query.createdAt = { $gt: new Date(since as string) };

      let q = Order.find(query).populate('tableId', 'name').sort({ createdAt: -1 });
      if (limit) q = q.limit(parseInt(limit as string, 10));

      const orders = await q.lean();
        const responseOrders: any[] = view === 'kitchen'
          ? orders.flatMap((order: any) => {
              if (order.kitchenBatches?.length) {
                return order.kitchenBatches
                  .filter((batch: any) => batch.status === 'PLACED' || batch.status === 'PREPARING')
                  .map((batch: any) => ({
                    ...order,
                    _id: `${order._id}:${batch.batchId}`,
                    parentOrderId: order._id,
                    kitchenBatchId: batch.batchId,
                    orderStatus: batch.status,
                    items: batch.items
                  }));
              }

              const items = order.pendingKitchenItems?.length ? order.pendingKitchenItems : order.items;
              return items.length > 0 ? [{ ...order, items }] : [];
            })
          : orders;

      res.status(200).json({
        success: true,
        data: responseOrders
      });
    } catch (error) {
      next(error);
    }
  }

  static async startTableOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const { tableId } = req.body;
      const order = await OrderService.startTableOrder(req.tenantId as string, tableId, (req as any).user.userId);
      res.json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  }

  static async updateOrderItems(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderId } = req.params;
      const { updates } = req.body;
      const order = await OrderService.updateOrderItems(req.tenantId as string, orderId as string, updates, (req as any).user.userId);
      res.json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  }

  static async sendOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderId } = req.params;
      const order = await OrderService.sendOrder(req.tenantId as string, orderId as string, (req as any).user.userId);
      res.json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  }

  static async updateOrderStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderId } = req.params;
      const { status } = req.body;
        const order = req.body.batchId
          ? await OrderService.updateKitchenBatchStatus(req.tenantId as string, orderId as string, req.body.batchId, status, (req as any).user.userId)
          : await OrderService.updateOrderStatus(req.tenantId as string, orderId as string, status, (req as any).user.userId);
      res.json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  }

  static async approveBillRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderId } = req.params;
      const order = await Order.findOne({ _id: orderId, restaurantId: req.tenantId });
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
      if (order.billRequestStatus !== 'REQUESTED') {
        return res.status(400).json({ success: false, message: 'No pending bill request for this order' });
      }

      order.paymentMethod = order.billRequestedPaymentMethod === 'ONLINE'
        ? PaymentMethod.ONLINE
        : PaymentMethod.CASH;
      order.paymentStatus = PaymentStatus.PAID;
      order.billRequestStatus = 'APPROVED';
      order.billApprovedAt = new Date();
      await order.save();

      const completedOrder = await OrderService.updateOrderStatus(
        req.tenantId as string,
        orderId as string,
        OrderStatus.COMPLETED,
        (req as any).user.userId
      );

      completedOrder.paymentMethod = order.paymentMethod;
      completedOrder.paymentStatus = PaymentStatus.PAID;
      completedOrder.billRequestStatus = 'APPROVED';
      completedOrder.billApprovedAt = order.billApprovedAt;
      await completedOrder.save();

      res.json({ success: true, data: completedOrder });
    } catch (error) {
      next(error);
    }
  }
}
