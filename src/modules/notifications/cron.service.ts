import cron from 'node-cron';
import { Restaurant } from '../restaurants/restaurant.model';
import { Order, PaymentStatus, OrderStatus } from '../orders/order.model';
import whatsappService from './whatsapp.service';
import mongoose from 'mongoose';

class CronService {
  public start() {
    // Run every minute
    cron.schedule('* * * * *', async () => {
      try {
        const now = new Date();
        const currentHours = now.getHours().toString().padStart(2, '0');
        const currentMinutes = now.getMinutes().toString().padStart(2, '0');
        const currentTime = `${currentHours}:${currentMinutes}`; // HH:mm format

        // Find restaurants with enabled notifications matching the current time
        const restaurants = await Restaurant.find({
          'notificationSettings.enabled': true,
          'notificationSettings.scheduledTime': currentTime,
        });

        for (const restaurant of restaurants) {
          if (!restaurant.notificationSettings?.whatsappNumber) continue;

          // Calculate today's sales
          const startOfDay = new Date();
          startOfDay.setHours(0, 0, 0, 0);

          const endOfDay = new Date();
          endOfDay.setHours(23, 59, 59, 999);

          const salesAggregate = await Order.aggregate([
            {
              $match: {
                restaurantId: restaurant._id,
                createdAt: { $gte: startOfDay, $lte: endOfDay },
                paymentStatus: PaymentStatus.PAID,
                orderStatus: { $ne: OrderStatus.CANCELLED }
              }
            },
            {
              $group: {
                _id: '$paymentMethod',
                total: { $sum: '$total' }
              }
            }
          ]);

          let cash = 0;
          let card = 0;
          let upi = 0;
          let totalSales = 0;

          salesAggregate.forEach((item) => {
            const methodTotal = item.total || 0;
            if (item._id === 'CASH') cash += methodTotal;
            if (item._id === 'CARD') card += methodTotal;
            if (item._id === 'UPI') upi += methodTotal;
            totalSales += methodTotal;
          });

          const message = `*Daily Sales Report*\nRestaurant: ${restaurant.name}\nDate: ${now.toLocaleDateString()}\n\n*Sales Breakdown:*\nCash: ₹${cash}\nCard: ₹${card}\nUPI: ₹${upi}\n\n*Total Sales:* ₹${totalSales}`;

          try {
            await whatsappService.sendMessage(restaurant.notificationSettings.whatsappNumber, message);
            console.log(`Sent daily report to restaurant ${restaurant._id} on WhatsApp: ${restaurant.notificationSettings.whatsappNumber}`);
          } catch (err) {
            console.error(`Failed to send daily report to ${restaurant._id}:`, err);
          }
        }
      } catch (error) {
        console.error('Error in cron job:', error);
      }
    });

    console.log('Cron jobs scheduled.');
  }
}

export default new CronService();
