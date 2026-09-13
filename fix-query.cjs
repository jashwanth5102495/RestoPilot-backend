const fs = require("fs");
let content = fs.readFileSync("src/modules/public/public.controller.ts", "utf8");

content = content.replace(
  `      const orders = await Order.find({
        restaurantId: restaurant._id,
        orderSource: OrderSource.TABLE_QR,
        orderStatus: { $nin: [OrderStatus.COMPLETED, OrderStatus.CANCELLED] }
      })`,
  `      const orders = await Order.find({
        restaurantId: restaurant._id,
        $or: [
          { orderSource: OrderSource.TABLE_QR },
          { tableId: { $ne: null } }
        ],
        orderStatus: { $nin: [OrderStatus.COMPLETED, OrderStatus.CANCELLED] }
      })`
);

fs.writeFileSync("src/modules/public/public.controller.ts", content);
console.log("getBillingQrTableOrders query updated!");
