import cron from 'node-cron';
import { Restaurant } from '../restaurants/restaurant.model';
import { Order, PaymentStatus, OrderStatus } from '../orders/order.model';
import { Ingredient } from '../ingredients/ingredient.model';
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

          let onlineOrdersCount = 0;
          let posOrdersCount = 0;
          
          const rawOrders = await Order.find({
            restaurantId: restaurant._id,
            createdAt: { $gte: startOfDay, $lte: endOfDay },
            paymentStatus: PaymentStatus.PAID,
            orderStatus: { $ne: OrderStatus.CANCELLED }
          });

          rawOrders.forEach(order => {
            if (order.orderSource === 'ONLINE') onlineOrdersCount++;
            else posOrdersCount++;
          });

          const ingredients = await Ingredient.find({ restaurantId: restaurant._id });
          const inventoryData = ingredients.map(ing => ({
            name: ing.name,
            quantity: ing.currentStock,
            unit: ing.unit
          }));

          try {
            const { PdfService } = await import('./pdf.service');
            const path = await import('path');
            const fs = await import('fs');
            const { MessageMedia } = await import('whatsapp-web.js');

            const reportData = {
              restaurantName: restaurant.name,
              date: now.toLocaleDateString(),
              sales: {
                total: totalSales,
                cash: cash,
                card: card,
                upi: upi,
                onlineOrders: onlineOrdersCount,
                posOrders: posOrdersCount
              },
              inventory: inventoryData
            };

            const tempDir = path.resolve(process.cwd(), 'temp');
            if (!fs.existsSync(tempDir)) {
              fs.mkdirSync(tempDir);
            }
            const pdfPath = path.join(tempDir, `report-${restaurant._id}-${Date.now()}.pdf`);
            
            await PdfService.generateDailyReport(reportData, pdfPath);

            const media = MessageMedia.fromFilePath(pdfPath);
            const message = `*Daily Sales & Inventory Report*\nRestaurant: ${restaurant.name}\nDate: ${now.toLocaleDateString()}\n\nPlease find your detailed report attached.`;

            // Note: whatsappService.sendMessage might need to support sending media. 
            // In whatsapp.service.ts, sendMessage uses client.sendMessage(chatId, text). We can pass media instead of text if it supports it, 
            // or we need to update whatsappService.sendMessage to accept media. 
            // I will update whatsapp.service.ts next.
            await whatsappService.sendMessage(restaurant.notificationSettings.whatsappNumber, message, media);
            
            console.log(`Sent daily report PDF to restaurant ${restaurant._id} on WhatsApp: ${restaurant.notificationSettings.whatsappNumber}`);
            
            // Clean up PDF
            fs.unlinkSync(pdfPath);
          } catch (err) {
            console.error(`Failed to generate/send daily report PDF to ${restaurant._id}:`, err);
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
