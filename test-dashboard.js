const mongoose = require('mongoose');
const { RestaurantService } = require('./src/modules/restaurants/restaurant.service');
const { Order } = require('./src/modules/orders/order.model');
const { Restaurant } = require('./src/modules/restaurants/restaurant.model');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/restropilot');
  const res = await Restaurant.findOne({});
  if (res) {
    console.log("Found restaurant:", res.name);
    const stats = await RestaurantService.getBranchDashboard(res._id.toString(), 'overall');
    console.log("Sales Data:", JSON.stringify(stats.salesData, null, 2));
    console.log("Total Sales:", stats.totalSales);
    console.log("Total Orders:", stats.totalOrders);
  } else {
    console.log("No restaurant found");
  }
  process.exit(0);
}
run();
