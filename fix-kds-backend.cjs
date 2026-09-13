const fs = require("fs");
let content = fs.readFileSync("src/modules/public/public.controller.ts", "utf8");

// 1. In placeTableQrOrder, ensure orderSource is set to TABLE_QR
const oldPlaceQr = `      // Check if table has active order, if not start one
      let order = await Order.findOne({ 
        restaurantId: restaurant._id, 
        tableId: tableId as string, 
        orderStatus: { $nin: [OrderStatus.COMPLETED, OrderStatus.CANCELLED] } 
      });

      if (!order) {
        order = await OrderService.startTableOrder(restaurant._id.toString(), tableId as string, null as any);
      }`;

const newPlaceQr = `      // Check if table has active order, if not start one
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
      await order.save();`;

content = content.replace(oldPlaceQr, newPlaceQr);

// 2. In getKdsOrders, populate both name and tableNumber
content = content.replace(
  `.populate('tableId', 'name').lean();`,
  `.populate('tableId', 'name tableNumber').lean();`
);

fs.writeFileSync("src/modules/public/public.controller.ts", content);
console.log("public.controller.ts fixed successfully!");
