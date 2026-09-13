const mongoose = require('mongoose');

async function test() {
  await mongoose.connect('mongodb://127.0.0.1:27017/restopilot');
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  
  const user = await User.findOne({ role: 'OWNER' }).lean();
  if (!user) {
    console.log('No owner found');
    return;
  }
  
  const jwt = require('jsonwebtoken');
  const token = jwt.sign({ userId: user._id.toString(), restaurantId: user.restaurantId?.toString(), role: user.role }, 'access_secret_for_development_only');
  
  try {
    const res = await fetch('http://localhost:5000/api/v1/public/settings/billing-ordering', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ enabled: true })
    });
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', data);
  } catch (err) {
    console.log('Error:', err);
  }
  
  await mongoose.disconnect();
}
test();
