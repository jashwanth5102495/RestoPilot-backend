const fs = require("fs");
let content = fs.readFileSync("src/modules/public/public.controller.ts", "utf8");

const oldPlaceQr = `      // Check if table has active order, if not start one
      let order = await Order.findOne({ 
        restaurantId: restaurant._id, 
        tableId: tableId as string, 
        orderStatus: { $nin: [OrderStatus.COMPLETED, OrderStatus.CANCELLED] } 
      });

      if (!order) {
        order = await OrderService.startTableOrder(restaurant._id.toString(), tableId as string, null as any);
      }

      // Mark order source as TABLE_QR so KDS and Billing can identify it
      order.orderSource = OrderSource.TABLE_QR;
      await order.save();

      // Update items
      if (items && items.length > 0) {
        order = await OrderService.updateOrderItems(restaurant._id.toString(), order._id.toString(), items, null as any);
      }

      // Send to kitchen (sets status to PLACED so KDS picks it up)
      order = await OrderService.sendOrder(restaurant._id.toString(), order._id.toString(), null as any);`;

const newPlaceQr = `      // Check if table has active order, if not start one
      let order = await Order.findOne({ 
        restaurantId: restaurant._id, 
        tableId: tableId as string, 
        orderStatus: { $nin: [OrderStatus.COMPLETED, OrderStatus.CANCELLED] } 
      });

      if (!order) {
        order = await OrderService.startTableOrder(restaurant._id.toString(), tableId as string, null as any);
      }

      // Map items to include quantityChange expected by updateOrderItems
      const itemUpdates = (items || []).map((it: any) => ({
        dishId: it.dishId,
        quantityChange: it.quantityChange ?? it.quantity ?? 1
      }));

      // Update items
      if (itemUpdates.length > 0) {
        order = await OrderService.updateOrderItems(restaurant._id.toString(), order._id.toString(), itemUpdates, null as any);
      }

      // Mark order source as TABLE_QR so KDS and Billing can identify it
      order.orderSource = OrderSource.TABLE_QR;
      await order.save();

      // Send to kitchen (sets status to PLACED so KDS picks it up)
      order = await OrderService.sendOrder(restaurant._id.toString(), order._id.toString(), null as any);`;

content = content.replace(oldPlaceQr, newPlaceQr);

fs.writeFileSync("src/modules/public/public.controller.ts", content);
console.log("placeTableQrOrder fixed in backend!");
