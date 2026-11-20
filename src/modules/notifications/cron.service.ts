import cron from 'node-cron';
import { Restaurant } from '../restaurants/restaurant.model';
import { Order, PaymentStatus, OrderStatus } from '../orders/order.model';
import { Ingredient } from '../ingredients/ingredient.model';
import { TelegramService } from './telegram.service';
import { PdfService, ReportData, DrinkReportItem } from './pdf.service';
import os from 'os';
import path from 'path';
import fs from 'fs';

/**
 * Calculates start and end Date objects in the restaurant's timezone for a shift.
 */
export function calculateShiftRange(
  dateStr: string, // YYYY-MM-DD
  startHHmm: string, // e.g. "10:00"
  endHHmm: string, // e.g. "23:30"
  isOvernight: boolean = false,
  timeZone: string = 'Asia/Kolkata'
): { startTime: Date; endTime: Date } {
  const [sH, sM] = (startHHmm || '10:00').split(':').map(Number);
  const [eH, eM] = (endHHmm || '23:30').split(':').map(Number);

  const offset = timeZone === 'Asia/Kolkata' ? '+05:30' : '+00:00';

  let sDate = new Date(`${dateStr}T00:00:00${offset}`);
  let eDate = new Date(`${dateStr}T00:00:00${offset}`);

  if (isOvernight) {
    sDate.setDate(sDate.getDate() - 1);
  }

  sDate.setHours(sH, sM, 0, 0);
  eDate.setHours(eH, eM, 59, 999);

  return { startTime: sDate, endTime: eDate };
}

/**
 * Core function to aggregate shift sales, complete drinks stock + movement, ingredients, generate PDF, and deliver to Telegram.
 */
export async function sendRestaurantShiftReport(params: {
  restaurant: any;
  shiftLabel: string;
  startTime: Date;
  endTime: Date;
  isTest?: boolean;
}): Promise<{ success: boolean; message: string }> {
  const { restaurant, shiftLabel, startTime, endTime, isTest = false } = params;

  if (!restaurant.notificationSettings?.telegramChatId) {
    throw new Error('Telegram Chat ID is not configured for this restaurant.');
  }

  const tz = restaurant.timezone || 'Asia/Kolkata';

  // 1. Aggregate Sales for the shift range
  const salesAggregate = await Order.aggregate([
    {
      $match: {
        restaurantId: restaurant._id,
        createdAt: { $gte: startTime, $lte: endTime },
        paymentStatus: PaymentStatus.PAID,
        orderStatus: { $ne: OrderStatus.CANCELLED },
      },
    },
    {
      $group: {
        _id: '$paymentMethod',
        total: { $sum: '$total' },
      },
    },
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

  // 2. Count Online vs POS orders
  let onlineOrdersCount = 0;
  let posOrdersCount = 0;

  const rawOrders = await Order.find({
    restaurantId: restaurant._id,
    createdAt: { $gte: startTime, $lte: endTime },
    paymentStatus: PaymentStatus.PAID,
    orderStatus: { $ne: OrderStatus.CANCELLED },
  });

  rawOrders.forEach((order) => {
    if (order.orderSource === 'ONLINE') onlineOrdersCount++;
    else posOrdersCount++;
  });

  // 3. Load Drinks & Drinks Shift Movement (from Drinks Tab / Billing)
  const { DrinkItem, DrinkStockLog } = await import('../drinks/drink.model');

  const drinks = await DrinkItem.find({
    restaurantId: restaurant._id,
    isDeleted: { $ne: true },
  }).sort({ category: 1, name: 1 });

  // Query shift stock activity (RESTOCK, SALE, ADJUSTMENT)
  const shiftLogs = await DrinkStockLog.find({
    restaurantId: restaurant._id,
    createdAt: { $gte: startTime, $lte: endTime },
  });

  const drinkMovement = new Map<string, { sold: number; restocked: number }>();
  let totalSoldThisShift = 0;
  let totalRestockedThisShift = 0;

  for (const log of shiftLogs) {
    const key = log.drinkId?.toString();
    if (!key) continue;
    if (!drinkMovement.has(key)) {
      drinkMovement.set(key, { sold: 0, restocked: 0 });
    }
    const m = drinkMovement.get(key)!;
    if (log.type === 'SALE') {
      const q = Math.abs(log.quantityChange);
      m.sold += q;
      totalSoldThisShift += q;
    } else if (log.type === 'RESTOCK') {
      const q = Math.abs(log.quantityChange);
      m.restocked += q;
      totalRestockedThisShift += q;
    }
  }

  // Build itemized drinks list
  const drinksReportList: DrinkReportItem[] = [];
  let totalDrinkUnitsInStock = 0;

  // Group drinks by category for Telegram message
  const drinksByCat = new Map<string, Array<{ name: string; stock: number; unit: string; sold: number; restocked: number }>>();

  for (const d of drinks) {
    const movement = drinkMovement.get(d._id.toString()) || { sold: 0, restocked: 0 };
    const stock = Number(d.currentStock || 0);
    totalDrinkUnitsInStock += stock;
    const cat = d.category || 'Drinks';

    drinksReportList.push({
      name: d.name,
      category: cat,
      currentStock: stock,
      unit: d.unit || 'bottle',
      sold: movement.sold,
      restocked: movement.restocked,
    });

    if (!drinksByCat.has(cat)) {
      drinksByCat.set(cat, []);
    }
    drinksByCat.get(cat)!.push({
      name: d.name,
      stock,
      unit: d.unit || 'bottle',
      sold: movement.sold,
      restocked: movement.restocked,
    });
  }

  // 4. Kitchen Ingredients
  const ingredients = await Ingredient.find({
    restaurantId: restaurant._id,
    isDeleted: { $ne: true },
  }).sort({ name: 1 });

  const ingredientsReportList = ingredients.map((ing) => ({
    name: ing.name,
    quantity: Number(ing.currentStock || 0),
    unit: ing.unit || 'unit',
  }));

  // Format readable dates
  const formatTimeOpts: Intl.DateTimeFormatOptions = {
    timeZone: tz,
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  };
  const startStr = startTime.toLocaleString('en-IN', formatTimeOpts);
  const endStr = endTime.toLocaleString('en-IN', formatTimeOpts);

  // 5. Generate PDF Report safely
  const reportData: ReportData = {
    restaurantName: restaurant.name,
    shiftTitle: `${shiftLabel} Sales & Stock Report`,
    date: `${startStr} to ${endStr}`,
    sales: {
      total: totalSales,
      cash,
      card,
      upi,
      onlineOrders: onlineOrdersCount,
      posOrders: posOrdersCount,
    },
    drinksInventory: drinksReportList,
    inventory: ingredientsReportList,
  };

  const tempDir = os.tmpdir();
  const pdfPath = path.join(tempDir, `shift-report-${restaurant._id}-${Date.now()}.pdf`);
  let pdfGenerated = false;

  try {
    await PdfService.generateDailyReport(reportData, pdfPath);
    pdfGenerated = true;
  } catch (pdfErr) {
    console.error('Failed to generate PDF, will deliver Telegram text message:', pdfErr);
  }

  // 6. Build Rich Telegram Message with Full Drinks Stock
  const totalOrders = onlineOrdersCount + posOrdersCount;

  // Build detailed drinks text
  let drinksStockDetails = '';
  drinksByCat.forEach((items, catName) => {
    drinksStockDetails += `\n*🏷️ ${catName} (${items.length}):*\n`;
    for (const it of items) {
      let activityBadge = '';
      if (it.sold > 0) activityBadge += ` (Out: -${it.sold})`;
      if (it.restocked > 0) activityBadge += ` (In: +${it.restocked})`;

      let statusBadge = '';
      if (it.stock <= 0) statusBadge = ' ⚠️ *(OUT OF STOCK)*';
      else if (it.stock <= 4) statusBadge = ' ⚠️ *(LOW)*';

      drinksStockDetails += `• ${it.name}: *${it.stock} ${it.unit}*${activityBadge}${statusBadge}\n`;
    }
  });

  const mainMessage =
    `*${isTest ? '🧪 [TEST] ' : ''}📋 ${shiftLabel} Report*\n` +
    `🏠 Restaurant: *${restaurant.name}*\n` +
    `🕒 Shift Period: *${startStr} — ${endStr}*\n\n` +
    `*📊 Shift Sales Summary:*\n` +
    `💰 Total Sales: *₹${totalSales.toFixed(2)}*\n` +
    `💵 Cash: ₹${cash.toFixed(2)}\n` +
    `📱 UPI: ₹${upi.toFixed(2)}\n` +
    `💳 Card: ₹${card.toFixed(2)}\n` +
    `📦 Orders: *${totalOrders}* (POS: ${posOrdersCount} | Online: ${onlineOrdersCount})\n\n` +
    `*🍾 DRINKS STOCK & MOVEMENT (Drinks Tab):*\n` +
    `📦 Total Drinks in Stock: *${totalDrinkUnitsInStock} units*\n` +
    `📤 Sold this shift: *${totalSoldThisShift} units*\n` +
    `📥 Restocked this shift: *${totalRestockedThisShift} units*\n` +
    `🥂 Tracked Drinks Items: *${drinks.length} items*\n` +
    `🥘 Kitchen Ingredients Tracked: *${ingredients.length} items*\n\n` +
    `*📋 Drinks Stock Status:*${drinksStockDetails}\n` +
    (pdfGenerated
      ? `📎 Detailed shift PDF report is attached below.`
      : `⚠️ Note: PDF attachment unavailable; text report generated.`);

  // 7. Deliver to Telegram (handles chunking if over 3,800 chars)
  const chatId = restaurant.notificationSettings.telegramChatId;

  try {
    if (mainMessage.length <= 3800) {
      await TelegramService.sendMessage(chatId, mainMessage, pdfGenerated ? pdfPath : undefined);
    } else {
      // Split into 2 messages: summary + PDF first, then full stock list
      const summaryMessage =
        `*${isTest ? '🧪 [TEST] ' : ''}📋 ${shiftLabel} Report*\n` +
        `🏠 Restaurant: *${restaurant.name}*\n` +
        `🕒 Shift Period: *${startStr} — ${endStr}*\n\n` +
        `*📊 Shift Sales Summary:*\n` +
        `💰 Total Sales: *₹${totalSales.toFixed(2)}*\n` +
        `💵 Cash: ₹${cash.toFixed(2)}\n` +
        `📱 UPI: ₹${upi.toFixed(2)}\n` +
        `💳 Card: ₹${card.toFixed(2)}\n` +
        `📦 Orders: *${totalOrders}* (POS: ${posOrdersCount} | Online: ${onlineOrdersCount})\n\n` +
        `*🍾 DRINKS MOVEMENT SUMMARY:*\n` +
        `📦 Total Drinks in Stock: *${totalDrinkUnitsInStock} units*\n` +
        `📤 Sold this shift: *${totalSoldThisShift} units*\n` +
        `📥 Restocked this shift: *${totalRestockedThisShift} units*\n\n` +
        `📎 Full PDF report attached. Itemized stock list follows below...`;

      await TelegramService.sendMessage(chatId, summaryMessage, pdfGenerated ? pdfPath : undefined);

      const drinksOnlyMessage =
        `*🍾 FULL DRINKS STOCK UPDATE (Drinks Tab)*\n` +
        `🏠 Restaurant: *${restaurant.name}*\n` +
        `📅 Date: ${endStr}\n` +
        drinksStockDetails;

      await TelegramService.sendMessage(chatId, drinksOnlyMessage);
    }
  } finally {
    if (pdfGenerated && fs.existsSync(pdfPath)) {
      try {
        fs.unlinkSync(pdfPath);
      } catch {}
    }
  }

  return { success: true, message: `${shiftLabel} report with full drinks stock sent successfully` };
}

class CronService {
  // Key: restaurantId_shiftX_YYYY-MM-DD
  private sentHistory = new Map<string, boolean>();

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
          const settings = restaurant.notificationSettings;
          if (!settings?.telegramChatId) continue;

          const tz = restaurant.timezone || 'Asia/Kolkata';

          // Current time & date in restaurant's local timezone
          let currentLocalTime = '';
          let localDateStr = '';
          try {
            const timeFormatter = new Intl.DateTimeFormat('en-GB', {
              timeZone: tz,
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            });
            currentLocalTime = timeFormatter.format(now);

            const dateFormatter = new Intl.DateTimeFormat('en-CA', {
              timeZone: tz,
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
            });
            localDateStr = dateFormatter.format(now);
          } catch {
            currentLocalTime = now.toLocaleTimeString('en-GB', {
              timeZone: 'Asia/Kolkata',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            });
            localDateStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
          }

          // -------------------------------------------------------------
          // SHIFT 1: 10:00 AM to 11:30 PM (Send at 23:30 or configured send time)
          // -------------------------------------------------------------
          const shift1Enabled = settings.shift1Enabled !== false;
          const shift1SendTime = settings.shift1SendTime || settings.scheduledTime || '23:30';
          const shift1Key = `${restaurant._id}_shift1_${localDateStr}`;

          if (shift1Enabled && currentLocalTime === shift1SendTime && !this.sentHistory.get(shift1Key)) {
            try {
              const { startTime, endTime } = calculateShiftRange(
                localDateStr,
                settings.shift1StartTime || '10:00',
                settings.shift1EndTime || '23:30',
                false,
                tz
              );

              await sendRestaurantShiftReport({
                restaurant,
                shiftLabel: 'Shift 1 (10:00 AM - 11:30 PM)',
                startTime,
                endTime,
                isTest: false,
              });

              this.sentHistory.set(shift1Key, true);
              console.log(`[Telegram Cron] Successfully sent Shift 1 report for ${restaurant.name} (${restaurant._id})`);
            } catch (err: any) {
              console.error(`[Telegram Cron] Failed Shift 1 report for ${restaurant._id}:`, err?.message || err);
            }
          }

          // -------------------------------------------------------------
          // SHIFT 2: 11:31 PM to 09:59 AM (Send at 10:00 AM or configured send time)
          // -------------------------------------------------------------
          const shift2Enabled = settings.shift2Enabled !== false;
          const shift2SendTime = settings.shift2SendTime || '10:00';
          const shift2Key = `${restaurant._id}_shift2_${localDateStr}`;

          if (shift2Enabled && currentLocalTime === shift2SendTime && !this.sentHistory.get(shift2Key)) {
            try {
              const { startTime, endTime } = calculateShiftRange(
                localDateStr,
                settings.shift2StartTime || '23:31',
                settings.shift2EndTime || '09:59',
                true,
                tz
              );

              await sendRestaurantShiftReport({
                restaurant,
                shiftLabel: 'Shift 2 (11:31 PM - 09:59 AM)',
                startTime,
                endTime,
                isTest: false,
              });

              this.sentHistory.set(shift2Key, true);
              console.log(`[Telegram Cron] Successfully sent Shift 2 report for ${restaurant.name} (${restaurant._id})`);
            } catch (err: any) {
              console.error(`[Telegram Cron] Failed Shift 2 report for ${restaurant._id}:`, err?.message || err);
            }
          }
        }
      } catch (error) {
        console.error('Error in cron job:', error);
      }
    });

    console.log('Cron jobs scheduled: Shift 1 (10:00 AM - 11:30 PM) & Shift 2 (11:31 PM - 09:59 AM) with full Drinks Stock.');
  }
}

export default new CronService();
