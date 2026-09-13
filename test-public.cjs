const mongoose = require('mongoose');

async function test() {
  await mongoose.connect('mongodb://127.0.0.1:27017/restopilot');
  const Restaurant = mongoose.model('Restaurant', new mongoose.Schema({
    waiterSlug: String, billingSlug: String, onlineSlug: String, kdsSlug: String, inventorySlug: String, tableQrSlug: String
  }, { strict: false }));
  
  const Table = mongoose.model('Table', new mongoose.Schema({}, { strict: false }));
  const Order = mongoose.model('Order', new mongoose.Schema({}, { strict: false }));
  
  const slug = 'mystery-roaster-cafe-billing';
  const cleaned = slug.trim().toLowerCase();
  const base = cleaned.replace(/-(waiter|billing|kds|order|pos|inventory|qr)(-\d+)?$/, '');
  const candidateSlugs = [cleaned, base, 'mystery-family-restaurant', 'mistory-family-restaurant', 'mystery-roaster-cafe'];
  
  const orConditions = [];
  for (const s of candidateSlugs) {
    orConditions.push(
      { waiterSlug: s }, { billingSlug: s }, { onlineSlug: s }, { kdsSlug: s }, { inventorySlug: s }, { tableQrSlug: s }
    );
  }
  
  const restaurant = await Restaurant.findOne({ $or: orConditions }).lean();
  console.log("Restaurant:", !!restaurant);
  
  if (restaurant) {
    const tables = await Table.find({ restaurantId: restaurant._id, isActive: true }).sort({ tableNumber: 1 }).lean();
    console.log("Tables:", tables.length);
    
    const activeOrders = await Order.find({ 
        restaurantId: restaurant._id, 
        tableId: { $in: tables.map(t => t._id) },
        orderStatus: { $nin: ['COMPLETED', 'CANCELLED'] }
      }).lean();
    console.log("Orders:", activeOrders.length);
  }
  
  await mongoose.disconnect();
}
test();
