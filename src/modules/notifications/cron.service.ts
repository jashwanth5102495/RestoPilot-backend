import cron from 'node-cron';
import { Restaurant } from '../restaurants/restaurant.model';
import { Order, PaymentStatus, OrderStatus } from '../orders/order.model';
import { Ingredient } from '../ingredients/ingredient.model';
import { TelegramService } from './telegram.service';
import os from 'os';
import path from 'path';
import fs from 'fs';

class CronService {
  private sentToday = new Map<string, string>(); // restaurantId -> YYYY-MM-DD

  public start() {
    // Run every minute
    cron.schedule('* * * * *', async () => {
      try {
        const now = new Date();

        // Find all restaurants with enabled telegram notifications
        const restaurants = await Restaurant.find({
          'notificationSettings.enabled': true,
        });

        for (const restaurant of restaurants) {
          if (!restaurant.notificationSettings?.telegramChatId) continue;

          const scheduledTime = restaurant.notificationSettings.scheduledTime || '21:00';
          const tz = restaurant.timezone || 'Asia/Kolkata';

          // Get current time formatted in restaurant's configured local timezone (HH:mm)
          let currentLocalTime = '';
          let localDateStr = '';
          try {
            const timeFormatter = new Intl.DateTimeFormat('en-GB', {
              timeZone: tz,
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            });
            currentLocalTime = timeFormatter.format(now);

            const dateFormatter = new Intl.DateTimeFormat('en-CA', {
              timeZone: tz,
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            });
            localDateStr = dateFormatter.format(now); // YYYY-MM-DD
          } catch (e) {
            currentLocalTime = now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false });
            localDateStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
          }

          // Check if scheduled time matches current local time
          if (currentLocalTime !== scheduledTime) {
            continue;
          }

          // Prevent duplicate sends within the same minute or same day
          const lastSentKey = restaurant._id.toString();
          if (this.sentToday.get(lastSentKey) === localDateStr) {
            continue;
          }

          // Calculate last 24 hours sales
          const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

          const salesAggregate = await Order.aggregate([
            {
              $match: {
                restaurantId: restaurant._id,
                createdAt: { $gte: twentyFourHoursAgo },
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
            createdAt: { $gte: twentyFourHoursAgo },
            paymentStatus: PaymentStatus.PAID,
            orderStatus: { $ne: OrderStatus.CANCELLED }
          });

          rawOrders.forEach(order => {
            if (order.orderSource === 'ONLINE') onlineOrdersCount++;
            else posOrdersCount++;
          });

          // Fetch all inventory: Ingredients AND Drinks
          const { DrinkItem } = await import('../drinks/drink.model');

          const ingredients = await Ingredient.find({
            restaurantId: restaurant._id,
            isDeleted: { $ne: true }
          }).sort({ name: 1 });

          const drinks = await DrinkItem.find({
            restaurantId: restaurant._id,
            isDeleted: { $ne: true }
          }).sort({ category: 1, name: 1 });

          const inventoryData = [
            ...ingredients.map(ing => ({
              name: ing.name,
              quantity: ing.currentStock,
              unit: ing.unit || 'unit'
            })),
            ...drinks.map(d => ({
              name: `${d.name} (${d.category || 'Drink'})`,
              quantity: d.currentStock,
              unit: d.unit || 'bottle'
            }))
          ];

          try {
            const { PdfService } = await import('./pdf.service');

            const reportData = {
              restaurantName: restaurant.name,
              date: `${now.toLocaleDateString('en-IN', { timeZone: tz })} (Last 24 Hours)`,
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

            const tempDir = os.tmpdir();
            const pdfPath = path.join(tempDir, `report-${restaurant._id}-${Date.now()}.pdf`);

            await PdfService.generateDailyReport(reportData, pdfPath);

            const message = `*Daily 24-Hour Sales & Inventory Report*\n` +
              `🏠 Restaurant: *${restaurant.name}*\n` +
              `📅 Date: ${now.toLocaleDateString('en-IN', { timeZone: tz })}\n\n` +
              `*📊 Last 24 Hours Sales:*\n` +
              `💰 Total Sales: *₹${totalSales.toFixed(2)}*\n` +
              `💵 Cash: ₹${cash.toFixed(2)}\n` +
              `💳 Card: ₹${card.toFixed(2)}\n` +
              `📱 UPI: ₹${upi.toFixed(2)}\n` +
              `📦 Online Orders: ${onlineOrdersCount} | POS Orders: ${posOrdersCount}\n\n` +
              `*📋 Inventory Summary:*\n` +
              `🥘 Kitchen Ingredients: ${ingredients.length}\n` +
              `🍾 Drinks & Beverages: ${drinks.length}\n` +
              `📦 Total Tracked Items: ${inventoryData.length}\n\n` +
              `Please find your detailed report attached below.`;

            await TelegramService.sendMessage(restaurant.notificationSettings.telegramChatId, message, pdfPath);

            this.sentToday.set(lastSentKey, localDateStr);
            console.log(`Sent daily 24h report PDF to restaurant ${restaurant._id} on Telegram: ${restaurant.notificationSettings.telegramChatId}`);

            // Clean up PDF
            if (fs.existsSync(pdfPath)) {
              fs.unlinkSync(pdfPath);
            }
          } catch (err: any) {
            console.error(`Failed to generate/send daily report PDF to ${restaurant._id}:`, err?.message || err);
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
