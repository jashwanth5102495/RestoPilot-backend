const fs = require("fs");
let content = fs.readFileSync("src/modules/public/public.controller.ts", "utf8");

const newMethods = `
  static async getBillingQrTableOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const restaurant = await Restaurant.findOne(PublicController.getRestaurantSlugFilter(slug, 'billingSlug')).lean();
      if (!restaurant) {
        return res.status(404).json({ success: false, message: 'Billing portal not found or disabled' });
      }

      const orders = await Order.find({
        restaurantId: restaurant._id,
        orderSource: OrderSource.TABLE_QR,
        orderStatus: { $nin: [OrderStatus.COMPLETED, OrderStatus.CANCELLED] }
      })
        .populate('tableId', 'name tableNumber')
        .sort({ createdAt: -1 })
        .lean();

      res.status(200).json({ success: true, data: orders });
    } catch (error) {
      next(error);
    }
  }

  static async settleBillingQrTableOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug, orderId } = req.params;
      const { paymentMethod } = req.body;

      const restaurant = await Restaurant.findOne(PublicController.getRestaurantSlugFilter(slug, 'billingSlug'));
      if (!restaurant) {
        return res.status(404).json({ success: false, message: 'Billing portal not found or disabled' });
      }

      const order = await Order.findOne({ _id: orderId, restaurantId: restaurant._id });
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      order.paymentMethod = paymentMethod || order.paymentMethod;
      order.paymentStatus = PaymentStatus.PAID;
      order.orderStatus = OrderStatus.COMPLETED;
      await order.save();

      await order.populate('tableId', 'name tableNumber');

      // Free the table
      try {
        const { Table } = await import('../tables/table.model');
        const { TableStatus } = await import('../tables/table.model');
        const remainingActive = await Order.countDocuments({
          restaurantId: restaurant._id,
          tableId: order.tableId,
          orderStatus: { $nin: [OrderStatus.COMPLETED, OrderStatus.CANCELLED] },
          _id: { $ne: order._id }
        });
        if (remainingActive === 0) {
          await Table.findByIdAndUpdate(order.tableId, { status: TableStatus.AVAILABLE });
        }
      } catch {}

      res.status(200).json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  }
`;

// Insert before final closing brace of class
content = content.replace(/\}\s*$/, newMethods + "\n}");
fs.writeFileSync("src/modules/public/public.controller.ts", content);
console.log("done");
