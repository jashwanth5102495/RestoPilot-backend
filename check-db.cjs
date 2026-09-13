const mongoose = require('mongoose');

async function check() {
  await mongoose.connect('mongodb://127.0.0.1:27017/restopilot');
  const db = mongoose.connection;
  const restaurants = await db.collection('restaurants').find({}).toArray();
  const users = await db.collection('users').find({}).toArray();
  console.log('Restaurants:', restaurants.length);
  console.log('Users:', users.length);
  
  if (restaurants.length > 0) {
    console.log('Sample Restaurant ID:', restaurants[0]._id, typeof restaurants[0]._id);
  }
  
  await mongoose.disconnect();
}
check();
