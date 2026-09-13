const fs = require("fs");
let content = fs.readFileSync("src/modules/public/public.controller.ts", "utf8");

// 1. Update getKdsOrders
content = content.replace(
  `      const orders = await Order.find({ 
        restaurantId: restaurant._id, 
        orderStatus: { $in: [OrderStatus.PLACED, OrderStatus.PREPARING] } 
      }).populate('tableId', 'name tableNumber').lean();`,
  `      const orders = await Order.find({ 
        restaurantId: restaurant._id, 
        orderStatus: { $in: [OrderStatus.PLACED, OrderStatus.PREPARING] },
        'items.0': { $exists: true }
      }).populate('tableId', 'name tableNumber').lean();`
);

// 2. Update getBillingQrTableOrders
const oldBillingQrQuery = `      const orders = await Order.find({
        restaurantId: restaurant._id,
        $or: [
          { orderSource: OrderSource.TABLE_QR },
          { tableId: { $ne: null } }
        ],
        orderStatus: { $nin: [OrderStatus.COMPLETED, OrderStatus.CANCELLED] }
      })
        .populate('tableId', 'name tableNumber')
        .sort({ createdAt: -1 })
        .lean();`;

const newBillingQrQuery = `      const orders = await Order.find({
        restaurantId: restaurant._id,
        orderSource: OrderSource.TABLE_QR,
        orderStatus: { $in: [OrderStatus.PLACED, OrderStatus.PREPARING, OrderStatus.READY] },
        'items.0': { $exists: true }
      })
        .populate('tableId', 'name tableNumber')
        .sort({ createdAt: -1 })
        .lean();`;

content = content.replace(oldBillingQrQuery, newBillingQrQuery);

fs.writeFileSync("src/modules/public/public.controller.ts", content);
console.log("Updated getKdsOrders and getBillingQrTableOrders filters!");
