import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function fix() {
  await mongoose.connect('mongodb://127.0.0.1:27017/restopilot');
  await mongoose.connection.collection('users').updateOne({ email: 'mystery01' }, { $set: { email: 'mystery01@gmail.com' } });
  await mongoose.connection.collection('restaurants').updateOne(
    { email: 'mystery01@gmail.com' },
    {
      $set: {
        isBillingEnabled: true,
        billingSlug: 'mystery-roaster-cafe',
        isOnlineOrderingEnabled: true,
        onlineSlug: 'mystery-roaster-cafe',
        isWaiterEnabled: true,
        waiterSlug: 'mystery-roaster-cafe',
        isKdsEnabled: true,
        kdsSlug: 'mystery-roaster-cafe'
      }
    }
  );
  console.log('Fixed email and enabled all public portals for Mystery Roaster Cafe!');
  process.exit(0);
}
fix();
