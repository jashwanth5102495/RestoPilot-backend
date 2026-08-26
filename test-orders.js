const mongoose = require('mongoose');
const { Order } = require('./src/modules/orders/order.model');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/restropilot');
  const orders = await Order.find().select('orderStatus total items restaurantId').lean();
  console.log(JSON.stringify(orders.slice(0, 5), null, 2));
  console.log("Total orders:", orders.length);
  process.exit(0);
}
run();
