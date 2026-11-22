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
  const [sH, sM] = (startHHmm || '10:00').split(':').map((v) => v.padStart(2, '0'));
  const [eH, eM] = (endHHmm || '23:30').split(':').map((v) => v.padStart(2, '0'));

  const offset = timeZone === 'Asia/Kolkata' ? '+05:30' : '+00:00';

  let startDateStr = dateStr;
  if (isOvernight) {
    // If overnight shift, start time is on previous calendar day
    const prevDate = new Date(`${dateStr}T12:00:00${offset}`);
    prevDate.setDate(prevDate.getDate() - 1);
    startDateStr = prevDate.toLocaleDateString('en-CA', { timeZone });
  }

  // Construct exact ISO timestamp with timezone offset to prevent UTC/local clock drift
  const startTime = new Date(`${startDateStr}T${sH}:${sM}:00${offset}`);
  const endTime = new Date(`${dateStr}T${eH}:${eM}:59.999${offset}`);

  return { startTime, endTime };
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
  forceChannel?: 'WHATSAPP' | 'TELEGRAM';
  overrideWhatsAppPhone?: string;
}): Promise<{ success: boolean; message: string }> {
  const { restaurant, shiftLabel, startTime, endTime, isTest = false } = params;

  const settings = restaurant.notificationSettings || {};
  const channel = params.forceChannel || settings.notificationChannel || 'WHATSAPP';
  const shouldSendWhatsApp = (channel === 'WHATSAPP' || channel === 'BOTH') && Boolean(params.overrideWhatsAppPhone || settings.whatsappPhoneNumber);
  const shouldSendTelegram = (channel === 'TELEGRAM' || channel === 'BOTH') && Boolean(settings.telegramChatId);

  if (!shouldSendWhatsApp && !shouldSendTelegram) {
    throw new Error('Neither WhatsApp phone number nor Telegram Chat ID is configured for this restaurant.');
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
        count: { $sum: 1 },
      },
    },
  ]);

  let cash = 0;
  let card = 0;
  let upi = 0;
  let onlinePayment = 0;
  let otherPayment = 0;
  let totalSales = 0;

  salesAggregate.forEach((item) => {
    const methodTotal = Number(item.total || 0);
    const method = String(item._id || '').toUpperCase();
    if (method === 'CASH') cash += methodTotal;
    else if (method === 'CARD') card += methodTotal;
    else if (method === 'UPI') upi += methodTotal;
    else if (method === 'ONLINE') onlinePayment += methodTotal;
    else otherPayment += methodTotal;
    totalSales += methodTotal;
  });

  // 2. Fetch raw orders to compute subtotal, discounts, taxes, order counts, and top selling dishes
  let onlineOrdersCount = 0;
  let posOrdersCount = 0;
  let totalDiscounts = 0;
  let totalTaxes = 0;

  const dishCounts = new Map<string, { name: string; qty: number; revenue: number }>();

  const rawOrders = await Order.find({
    restaurantId: restaurant._id,
    createdAt: { $gte: startTime, $lte: endTime },
    paymentStatus: PaymentStatus.PAID,
    orderStatus: { $ne: OrderStatus.CANCELLED },
  }).lean();

  rawOrders.forEach((order) => {
    if (order.orderSource === 'ONLINE' || (order as any).orderSource === 'TABLE_QR') onlineOrdersCount++;
    else posOrdersCount++;

    totalDiscounts += Number(order.discount || 0);
    totalTaxes += Number(order.tax || 0);

    for (const item of (order.items || [])) {
      const name = item.dishName || 'Item';
      const existing = dishCounts.get(name) || { name, qty: 0, revenue: 0 };
      existing.qty += Number(item.quantity || 1);
      existing.revenue += Number(item.lineTotal || (item.unitPrice * (item.quantity || 1)));
      dishCounts.set(name, existing);
    }
  });

  const totalOrders = onlineOrdersCount + posOrdersCount;
  const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

  const topDishes = Array.from(dishCounts.values())
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  // 3. Load Drinks & Drinks Shift Movement (from Drinks Tab / Billing)
  const { DrinkItem, DrinkStockLog } = await import('../drinks/drink.model');

  const drinks = await DrinkItem.find({
    restaurantId: restaurant._id,
    isDeleted: { $ne: true },
  }).sort({ category: 1, name: 1 }).lean();

  // Query shift stock activity (RESTOCK, SALE, ADJUSTMENT)
  const shiftLogs = await DrinkStockLog.find({
    restaurantId: restaurant._id,
    createdAt: { $gte: startTime, $lte: endTime },
  }).lean();

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
  const outOfStockItems: string[] = [];
  const lowStockItems: string[] = [];

  // Group drinks by category
  const drinksByCat = new Map<string, Array<{ name: string; stock: number; unit: string; sold: number; restocked: number }>>();

  for (const d of drinks) {
    const movement = drinkMovement.get(d._id.toString()) || { sold: 0, restocked: 0 };
    const stock = Number(d.currentStock || 0);
    totalDrinkUnitsInStock += stock;
    const cat = d.category || 'Drinks';

    if (stock <= 0) {
      outOfStockItems.push(d.name);
    } else if (stock <= 4) {
      lowStockItems.push(`${d.name} (${stock})`);
    }

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
  }).sort({ name: 1 }).lean();

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
      online: onlinePayment,
      other: otherPayment,
      discounts: totalDiscounts,
      taxes: totalTaxes,
      onlineOrders: onlineOrdersCount,
      posOrders: posOrdersCount,
      avgOrderValue,
    },
    topDishes: topDishes.map((td) => ({ name: td.name, qty: td.qty, total: td.revenue })),
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
    console.error('Failed to generate PDF, will deliver Telegram/WhatsApp text message:', pdfErr);
  }

  // 6. Build Detailed WhatsApp / Telegram Message
  let drinksStockDetails = '';
  drinksByCat.forEach((items, catName) => {
    drinksStockDetails += `\n*🏷️ ${catName} (${items.length}):*\n`;
    for (const it of items) {
      let activityBadge = '';
      if (it.sold > 0) activityBadge += ` (Out: -${it.sold})`;
      if (it.restocked > 0) activityBadge += ` (In: +${it.restocked})`;

      let statusBadge = '';
      if (it.stock <= 0) statusBadge = ' ❌ *(OUT OF STOCK)*';
      else if (it.stock <= 4) statusBadge = ' ⚠️ *(LOW)*';

      drinksStockDetails += `• ${it.name}: *${it.stock} ${it.unit}*${activityBadge}${statusBadge}\n`;
    }
  });

  // Top Dishes string
  let topDishesText = '';
  if (topDishes.length > 0) {
    topDishesText = `*🍲 TOP 5 SELLING DISHES:*\n` +
      topDishes.map((d, i) => `${i + 1}. ${d.name} — *${d.qty} orders* (₹${d.revenue.toFixed(2)})`).join('\n') +
      '\n\n';
  }

  const mainMessage =
    `*${isTest ? '🧪 [TEST] ' : ''}📋 ${shiftLabel} Report*\n` +
    `🏠 Restaurant: *${restaurant.name}*\n` +
    `🕒 Shift Period: *${startStr} — ${endStr}*\n\n` +
    `*💰 REVENUE & SALES BREAKDOWN:*\n` +
    `💵 Total Sales (Paid): *₹${totalSales.toFixed(2)}*\n` +
    `• Cash: ₹${cash.toFixed(2)}\n` +
    `• UPI: ₹${upi.toFixed(2)}\n` +
    (onlinePayment > 0 ? `• Online / Gateway: ₹${onlinePayment.toFixed(2)}\n` : '') +
    (card > 0 ? `• Card: ₹${card.toFixed(2)}\n` : '') +
    (otherPayment > 0 ? `• Other: ₹${otherPayment.toFixed(2)}\n` : '') +
    (totalDiscounts > 0 ? `🏷️ Discounts Given: ₹${totalDiscounts.toFixed(2)}\n` : '') +
    (totalTaxes > 0 ? `🧾 Taxes (GST): ₹${totalTaxes.toFixed(2)}\n` : '') +
    `\n*📦 ORDER SUMMARY:*\n` +
    `• Total Orders: *${totalOrders}* (POS: ${posOrdersCount} | Online/QR: ${onlineOrdersCount})\n` +
    `• Avg Order Value (AOV): *₹${avgOrderValue.toFixed(2)}*\n\n` +
    topDishesText +
    `*🍾 DRINKS TAB INVENTORY & MOVEMENT:*\n` +
    `📦 Total Drinks in Stock: *${totalDrinkUnitsInStock} units*\n` +
    `📤 Sold this shift: *${totalSoldThisShift} units*\n` +
    `📥 Restocked this shift: *${totalRestockedThisShift} units*\n` +
    `🥂 Active Drink Items: *${drinks.length} items*\n` +
    (outOfStockItems.length > 0 ? `❌ Out of Stock (${outOfStockItems.length}): ${outOfStockItems.join(', ')}\n` : '✅ Out of Stock: None\n') +
    (lowStockItems.length > 0 ? `⚠️ Low Stock (<5): ${lowStockItems.join(', ')}\n` : '') +
    `\n*📋 ITEMIZED DRINKS STOCK:*${drinksStockDetails}\n` +
    (pdfGenerated
      ? `📎 Detailed shift PDF report is attached below.`
      : `⚠️ Note: PDF attachment unavailable; text report generated.`);

  // Fallback chunked summary if message exceeds 3,800 chars
  const summaryMessage =
    `*${isTest ? '🧪 [TEST] ' : ''}📋 ${shiftLabel} Report*\n` +
    `🏠 Restaurant: *${restaurant.name}*\n` +
    `🕒 Shift Period: *${startStr} — ${endStr}*\n\n` +
    `*💰 REVENUE & SALES BREAKDOWN:*\n` +
    `💵 Total Sales (Paid): *₹${totalSales.toFixed(2)}*\n` +
    `• Cash: ₹${cash.toFixed(2)}\n` +
    `• UPI: ₹${upi.toFixed(2)}\n` +
    (onlinePayment > 0 ? `• Online / Gateway: ₹${onlinePayment.toFixed(2)}\n` : '') +
    (card > 0 ? `• Card: ₹${card.toFixed(2)}\n` : '') +
    (totalDiscounts > 0 ? `🏷️ Discounts Given: ₹${totalDiscounts.toFixed(2)}\n` : '') +
    (totalTaxes > 0 ? `🧾 Taxes (GST): ₹${totalTaxes.toFixed(2)}\n` : '') +
    `\n*📦 ORDER SUMMARY:*\n` +
    `• Total Orders: *${totalOrders}* (POS: ${posOrdersCount} | Online/QR: ${onlineOrdersCount})\n` +
    `• Avg Order Value (AOV): *₹${avgOrderValue.toFixed(2)}*\n\n` +
    topDishesText +
    `*🍾 DRINKS MOVEMENT SUMMARY:*\n` +
    `📦 Total Drinks in Stock: *${totalDrinkUnitsInStock} units*\n` +
    `📤 Sold this shift: *${totalSoldThisShift} units*\n` +
    `📥 Restocked this shift: *${totalRestockedThisShift} units*\n\n` +
    `📎 Full PDF report attached. Itemized stock list follows below...`;

  const drinksOnlyMessage =
    `*🍾 FULL DRINKS STOCK UPDATE (Drinks Tab)*\n` +
    `🏠 Restaurant: *${restaurant.name}*\n` +
    `📅 Shift: ${shiftLabel}\n` +
    drinksStockDetails;

  const deliveredChannels: string[] = [];

  // A. Deliver to WhatsApp
  if (shouldSendWhatsApp) {
    try {
      const { WhatsAppService } = await import('./whatsapp.service');
      const targetPhone = params.overrideWhatsAppPhone || settings.whatsappPhoneNumber;
      if (mainMessage.length <= 3800) {
        await WhatsAppService.sendMessage(restaurant._id.toString(), targetPhone, mainMessage, pdfGenerated ? pdfPath : undefined);
      } else {
        await WhatsAppService.sendMessage(restaurant._id.toString(), targetPhone, summaryMessage, pdfGenerated ? pdfPath : undefined);
        await WhatsAppService.sendMessage(restaurant._id.toString(), targetPhone, drinksOnlyMessage);
      }
      deliveredChannels.push('WhatsApp');
    } catch (waErr: any) {
      console.error(`[WhatsApp Deliver Error] Restaurant ${restaurant._id}:`, waErr?.message || waErr);
      if (params.forceChannel === 'WHATSAPP') throw waErr;
    }
  }

  // B. Deliver to Telegram
  if (shouldSendTelegram) {
    try {
      const chatId = settings.telegramChatId;
      if (mainMessage.length <= 3800) {
        await TelegramService.sendMessage(chatId, mainMessage, pdfGenerated ? pdfPath : undefined);
      } else {
        await TelegramService.sendMessage(chatId, summaryMessage, pdfGenerated ? pdfPath : undefined);
        await TelegramService.sendMessage(chatId, drinksOnlyMessage);
      }
      deliveredChannels.push('Telegram');
    } catch (tgErr: any) {
      console.error(`[Telegram Deliver Error] Restaurant ${restaurant._id}:`, tgErr?.message || tgErr);
      if (params.forceChannel === 'TELEGRAM') throw tgErr;
    }
  }

  // Clean up temp PDF
  if (pdfGenerated && fs.existsSync(pdfPath)) {
    try {
      fs.unlinkSync(pdfPath);
    } catch {}
  }

  if (deliveredChannels.length === 0) {
    throw new Error('Failed to deliver report to configured notification channels.');
  }

  return {
    success: true,
    message: `${shiftLabel} report with full drinks stock sent successfully via ${deliveredChannels.join(' & ')}`,
  };
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
          if (!settings?.telegramChatId && !settings?.whatsappPhoneNumber) continue;

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
