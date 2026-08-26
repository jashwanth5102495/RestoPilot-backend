const mongoose = require('mongoose');
const { RestaurantService } = require('./src/modules/restaurants/restaurant.service');
const { Order } = require('./src/modules/orders/order.model');
const { Restaurant } = require('./src/modules/restaurants/restaurant.model');

async function run() {
  require('ts-node/register'); // if running directly with node we might need this or just use ts-node
  // actually wait we can just run npx ts-node test-dashboard.ts
}
run();
