import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function fix() {
  await mongoose.connect('mongodb://127.0.0.1:27017/restopilot');
  await mongoose.connection.collection('users').updateOne({ email: 'mystery01' }, { $set: { email: 'mystery01@gmail.com' } });
  await mongoose.connection.collection('restaurants').updateOne({ email: 'mystery01' }, { $set: { email: 'mystery01@gmail.com' } });
  console.log('Fixed email!');
  process.exit(0);
}
fix();
