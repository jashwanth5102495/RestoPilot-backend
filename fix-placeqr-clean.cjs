const fs = require("fs");
let lines = fs.readFileSync("src/modules/public/public.controller.ts", "utf8").split(/\r?\n/);

let idx = lines.findIndex(l => l.includes("static async placeTableQrOrder"));
console.log("placeTableQrOrder line:", idx);

if (idx !== -1) {
  let endIdx = lines.findIndex((l, i) => i > idx && l.includes("static async getBillingQrTableOrders"));
  console.log("getBillingQrTableOrders line:", endIdx);

  const newMethod = [
    "  static async placeTableQrOrder(req: Request, res: Response, next: NextFunction) {",
    "    try {",
    "      const { slug, tableId } = req.params;",
    "      const { items } = req.body;",
    "",
    "      const restaurant = await Restaurant.findOne(PublicController.getRestaurantSlugFilter(slug, 'tableQrSlug'));",
    "      if (!restaurant || !restaurant.isTableQrEnabled) {",
    "        return res.status(404).json({ success: false, message: 'Table QR ordering not found or disabled' });",
    "      }",
    "",
    "      const { Table } = await import('../tables/table.model');",
    "      const table = await Table.findOne({ _id: tableId, restaurantId: restaurant._id }).lean();",
    "      if (!table) {",
    "        return res.status(404).json({ success: false, message: 'Table not found' });",
    "      }",
    "",
    "      const { OrderService } = await import('../orders/order.service');",
    "",
    "      // Check if table has active order, if not start one",
    "      let order = await Order.findOne({ ",
    "        restaurantId: restaurant._id, ",
    "        tableId: tableId as string, ",
    "        orderStatus: { $nin: [OrderStatus.COMPLETED, OrderStatus.CANCELLED] } ",
    "      });",
    "",
    "      if (!order) {",
    "        order = await OrderService.startTableOrder(restaurant._id.toString(), tableId as string, null as any);",
    "      }",
    "",
    "      // Map items to include quantityChange expected by updateOrderItems",
    "      const itemUpdates = (items || []).map((it: any) => ({",
    "        dishId: it.dishId,",
    "        quantityChange: it.quantityChange ?? it.quantity ?? 1",
    "      }));",
    "",
    "      // Update items",
    "      if (itemUpdates.length > 0) {",
    "        order = await OrderService.updateOrderItems(restaurant._id.toString(), order._id.toString(), itemUpdates, null as any);",
    "      }",
    "",
    "      // Mark order source as TABLE_QR so KDS and Billing can identify it",
    "      order.orderSource = OrderSource.TABLE_QR;",
    "      await order.save();",
    "",
    "      // Send to kitchen",
    "      order = await OrderService.sendOrder(restaurant._id.toString(), order._id.toString(), null as any);",
    "",
    "      // Populate tableId for response",
    "      await order.populate('tableId', 'name tableNumber');",
    "",
    "      res.status(200).json({ success: true, data: order });",
    "    } catch (error) {",
    "      next(error);",
    "    }",
    "  }"
  ];

  lines.splice(idx, endIdx - idx, ...newMethod);
  fs.writeFileSync("src/modules/public/public.controller.ts", lines.join("\n"));
  console.log("placeTableQrOrder updated!");
}
