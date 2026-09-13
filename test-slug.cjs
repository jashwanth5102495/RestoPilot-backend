const mongoose = require('mongoose');

async function test() {
  await mongoose.connect('mongodb://127.0.0.1:27017/restopilot');
  const Restaurant = mongoose.model('Restaurant', new mongoose.Schema({}, { strict: false }));
  
  const slug = 'mystery-roaster-cafe-billing';
  
  const raw = slug;
  const cleaned = (raw || '').trim().toLowerCase();
  const base = cleaned.replace(/-(waiter|billing|kds|order|pos|inventory|qr)(-\d+)?$/, '');
  
  const candidateSlugs = Array.from(new Set([cleaned, base]));
  if (cleaned.includes('mystery') || cleaned.includes('mistory')) {
    candidateSlugs.push('mystery-family-restaurant', 'mistory-family-restaurant', 'mystery-roaster-cafe');
  }

  const orConditions = [];
  for (const s of candidateSlugs) {
    orConditions.push(
      { waiterSlug: s },
      { billingSlug: s },
      { onlineSlug: s },
      { kdsSlug: s },
      { inventorySlug: s },
      { tableQrSlug: s }
    );
  }
  
  const filter = { $or: orConditions };
  
  const rest = await Restaurant.findOne(filter).lean();
  console.log("Rest found:", !!rest, rest?.name);
  if (rest) {
    console.log("isBillingEnabled:", rest.isBillingEnabled);
  }
  
  await mongoose.disconnect();
}
test();
