const fs = require("fs");
let content = fs.readFileSync("src/modules/public/public.controller.ts", "utf8");

const oldCode = `      // Update items
      if (items && items.length > 0) {
        order = await OrderService.updateOrderItems(restaurant._id.toString(), order._id.toString(), items, null as any);
      }

      // Send to kitchen
      order = await OrderService.sendOrder(restaurant._id.toString(), order._id.toString(), null as any);

      res.status(200).json({ success: true, data: order });`;

const newCode = `      // Always mark as TABLE_QR source so billing/KDS can identify these orders
      if (order.orderSource !== OrderSource.TABLE_QR) {
        order.orderSource = OrderSource.TABLE_QR;
        await order.save();
      }

      // Update items
      if (items && items.length > 0) {
        order = await OrderService.updateOrderItems(restaurant._id.toString(), order._id.toString(), items, null as any);
      }

      // Send to kitchen (sets status to PLACED so KDS picks it up)
      order = await OrderService.sendOrder(restaurant._id.toString(), order._id.toString(), null as any);

      // Populate tableId name for the response
      await order.populate('tableId', 'name tableNumber');

      res.status(200).json({ success: true, data: order });`;

content = content.replace(oldCode, newCode);
fs.writeFileSync("src/modules/public/public.controller.ts", content);
console.log("done");
