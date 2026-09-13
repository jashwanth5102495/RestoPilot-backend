const mongoose = require('mongoose');

async function check() {
  await mongoose.connect('mongodb://127.0.0.1:27017/restopilot');
  const db = mongoose.connection;
  
  const Restaurant = mongoose.model('Restaurant', new mongoose.Schema({}, { strict: false }));
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  
  const users = await User.find({ role: 'OWNER' }).lean();
  for (const user of users) {
    console.log('User:', user.name, user._id, user.restaurantId);
    let restId = user.restaurantId;
    if (!restId) {
      const dbRest = await Restaurant.findOne({ ownerId: user._id }).lean();
      if (dbRest) {
        console.log('Found rest by ownerId:', dbRest._id, dbRest.name);
        restId = dbRest._id;
      }
    }
    
    if (restId) {
      const rest = await Restaurant.findById(restId).lean();
      console.log('findById result:', !!rest);
    } else {
      console.log('No restId resolved');
    }
  }
  
  await mongoose.disconnect();
}
check();
