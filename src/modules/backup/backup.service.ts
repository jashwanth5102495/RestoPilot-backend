import crypto from 'crypto';
import mongoose, { Types } from 'mongoose';
import { BackupRecord, BackupType, BackupStatus, IBackupRecord } from './backup-record.model';
import { HistoricalOrder } from './historical-order.model';
import { AuditLog, AuditAction } from './audit-log.model';
import { Order } from '../orders/order.model';
import { Bill } from '../billing/bill.model';
import { Restaurant } from '../restaurants/restaurant.model';
import { SequenceService, runWithTransaction } from '../shared/sequence.service';
import { AppError, ForbiddenError, ValidationError } from '../../shared/errors/AppError';

export class BackupService {
  /**
   * Calculates SHA-256 checksum for a stringified JSON payload.
   */
  static calculateChecksum(content: string): string {
    return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
  }

  /**
   * Generates a self-describing sales backup payload for a given restaurant & period.
   */
  static async generateBackup(
    restaurantId: string | Types.ObjectId,
    periodStart: Date,
    periodEnd: Date,
    backupType: BackupType,
    userId: string | Types.ObjectId
  ) {
    const restaurant = await Restaurant.findById(restaurantId).lean();
    if (!restaurant) throw new AppError('Restaurant not found', 404);

    const start = new Date(periodStart);
    const end = new Date(periodEnd);

    // Fetch active orders and bills for the date range
    const orders = await Order.find({
      restaurantId: restaurant._id,
      createdAt: { $gte: start, $lte: end }
    }).populate('tableId', 'name tableNumber').lean();

    const bills = await Bill.find({
      restaurantId: restaurant._id,
      createdAt: { $gte: start, $lte: end }
    }).lean();

    let totalSales = 0;
    let totalTax = 0;
    let totalDiscount = 0;

    orders.forEach(o => {
      totalSales += o.total || 0;
      totalTax += o.tax || 0;
      totalDiscount += o.discount || 0;
    });

    totalSales = Number(totalSales.toFixed(2));
    totalTax = Number(totalTax.toFixed(2));
    totalDiscount = Number(totalDiscount.toFixed(2));

    const backupPayload = {
      backupVersion: 1,
      applicationVersion: '1.0.1',
      restaurant: {
        id: restaurant._id.toString(),
        name: restaurant.name
      },
      period: {
        from: start.toISOString(),
        to: end.toISOString()
      },
      createdAt: new Date().toISOString(),
      metadata: {
        orderCount: orders.length,
        billCount: bills.length,
        totalSales,
        totalTax,
        totalDiscount
      },
      data: {
        orders: orders.map(o => ({
          _id: (o as any)._id.toString(),
          orderNumber: o.orderNumber,
          createdAt: o.createdAt,
          subtotal: o.subtotal,
          discount: o.discount,
          tax: o.tax,
          cgst: o.cgst || 0,
          sgst: o.sgst || 0,
          total: o.total,
          paymentMethod: o.paymentMethod || 'CASH',
          paymentStatus: o.paymentStatus || 'PAID',
          orderStatus: o.orderStatus || 'COMPLETED',
          orderSource: o.orderSource || 'IN_STORE',
          customerInfo: o.customerInfo,
          tableName: (o as any).tableId?.name || ((o as any).tableId?.tableNumber ? `Table ${(o as any).tableId.tableNumber}` : undefined),
          items: (o.items || []).map(i => ({
            dishName: i.dishName,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            taxRate: i.taxRate,
            lineTotal: i.lineTotal
          }))
        })),
        bills: bills.map(b => ({
          _id: (b as any)._id.toString(),
          billNumber: b.billNumber,
          orderId: (b as any).orderId?.toString(),
          total: b.total,
          paymentMethod: b.paymentMethod,
          issuedAt: b.issuedAt
        }))
      }
    };

    const fileContent = JSON.stringify(backupPayload, null, 2);
    const checksum = this.calculateChecksum(fileContent);
    const fileSize = Buffer.byteLength(fileContent, 'utf8');

    const backupId = `BCK-${start.getFullYear()}${String(start.getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const backupRecord = new BackupRecord({
      backupId,
      restaurantId: restaurant._id,
      periodStart: start,
      periodEnd: end,
      backupType,
      backupVersion: 1,
      fileSize,
      orderCount: orders.length,
      billCount: bills.length,
      totalSales,
      totalTax,
      totalDiscount,
      checksum,
      status: BackupStatus.VERIFIED,
      createdBy: new Types.ObjectId(userId)
    });

    await backupRecord.save();

    // Log Audit Action
    await AuditLog.create({
      action: AuditAction.BACKUP_GENERATED,
      restaurantId: restaurant._id,
      userId: new Types.ObjectId(userId),
      details: `Generated ${backupType} backup (${backupId}) for period ${start.toISOString()} - ${end.toISOString()} with ${orders.length} orders totaling ₹${totalSales}`,
      checksum
    });

    return { backupRecord, fileContent, checksum };
  }

  /**
   * Executes Monthly Archival: Moves orders to HistoricalOrder & removes verified records from active DB atomically.
   */
  static async executeMonthlyArchive(
    restaurantId: string | Types.ObjectId,
    backupRecordId: string,
    confirmationText: string,
    userId: string | Types.ObjectId
  ) {
    const backupRecord = await BackupRecord.findOne({ _id: backupRecordId, restaurantId });
    if (!backupRecord) throw new AppError('Backup record not found', 404);

    const periodYear = backupRecord.periodStart.getFullYear();
    const periodMonthName = backupRecord.periodStart.toLocaleString('default', { month: 'long' }).toUpperCase();
    const expectedConfirmation = `ARCHIVE ${periodMonthName} ${periodYear}`;

    if (confirmationText.trim().toUpperCase() !== expectedConfirmation) {
      throw new ValidationError(`Confirmation text mismatch. You must type "${expectedConfirmation}" to proceed.`);
    }

    // Safety check: Cannot archive current month or future data
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    if (backupRecord.periodEnd >= currentMonthStart) {
      throw new ValidationError('Cannot archive current or future month data. Archival is only allowed for completed past months.');
    }

    return runWithTransaction(async (session) => {
      // 1. Fetch active orders in period
      const query = Order.find({
        restaurantId: new Types.ObjectId(restaurantId),
        createdAt: { $gte: backupRecord.periodStart, $lte: backupRecord.periodEnd }
      });
      const orders = await (session ? query.session(session) : query);

      if (orders.length === 0) {
        backupRecord.status = BackupStatus.ARCHIVED;
        await backupRecord.save(session ? { session } : {});
        return { archivedCount: 0, backupRecord };
      }

      // 2. Move to HistoricalOrder
      const historicalDocs = orders.map(o => ({
        restaurantId: new Types.ObjectId(restaurantId),
        archiveId: backupRecord._id,
        orderNumber: o.orderNumber,
        originalCreatedAt: o.createdAt,
        items: (o.items || []).map(i => ({
          dishName: i.dishName,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          taxRate: i.taxRate,
          lineTotal: i.lineTotal
        })),
        subtotal: o.subtotal,
        discount: o.discount || 0,
        tax: o.tax,
        cgst: o.cgst || 0,
        sgst: o.sgst || 0,
        total: o.total,
        paymentMethod: o.paymentMethod || 'CASH',
        paymentStatus: o.paymentStatus || 'PAID',
        orderStatus: o.orderStatus || 'COMPLETED',
        orderSource: o.orderSource || 'IN_STORE',
        customerInfo: o.customerInfo,
        tableName: (o as any).tableName,
        importedAt: new Date()
      }));

      await HistoricalOrder.create(historicalDocs, session ? { session } : {});

      // 3. Remove active orders and bills for this period safely
      await Order.deleteMany(
        { restaurantId: new Types.ObjectId(restaurantId), createdAt: { $gte: backupRecord.periodStart, $lte: backupRecord.periodEnd } },
        session ? { session } : {}
      );

      await Bill.deleteMany(
        { restaurantId: new Types.ObjectId(restaurantId), createdAt: { $gte: backupRecord.periodStart, $lte: backupRecord.periodEnd } },
        session ? { session } : {}
      );

      backupRecord.status = BackupStatus.ARCHIVED;
      await backupRecord.save(session ? { session } : {});

      await AuditLog.create([{
        action: AuditAction.MONTHLY_ARCHIVED,
        restaurantId: new Types.ObjectId(restaurantId),
        userId: new Types.ObjectId(userId),
        details: `Archived ${orders.length} orders for ${periodMonthName} ${periodYear} into historical storage and deleted from production database.`,
        checksum: backupRecord.checksum
      }], session ? { session } : {});

      return { archivedCount: orders.length, backupRecord };
    });
  }

  /**
   * Uploads and validates a historical backup file, returning preview info before import.
   */
  static async validateAndPreviewUpload(
    fileContent: string,
    authenticatedRestaurantId: string,
    userId: string | Types.ObjectId
  ) {
    let payload: any;
    try {
      payload = JSON.parse(fileContent);
    } catch {
      throw new ValidationError('Invalid JSON file format');
    }

    if (!payload.backupVersion || !payload.restaurant || !payload.data || !Array.isArray(payload.data.orders)) {
      throw new ValidationError('Invalid backup file structure. Missing required metadata or order records.');
    }

    // Tenant Isolation Enforcement
    if (payload.restaurant.id !== authenticatedRestaurantId.toString()) {
      throw new ForbiddenError('Backup file belongs to a different restaurant. Cross-restaurant restoration is strictly prohibited.');
    }

    const calculatedChecksum = this.calculateChecksum(fileContent);

    // Duplicate check
    const existingImport = await HistoricalOrder.findOne({
      restaurantId: new Types.ObjectId(authenticatedRestaurantId),
      originalCreatedAt: {
        $gte: new Date(payload.period.from),
        $lte: new Date(payload.period.to)
      }
    }).lean();

    const orders = payload.data.orders || [];
    let grossSales = 0;
    let totalTax = 0;
    let totalDiscount = 0;

    orders.forEach((o: any) => {
      grossSales += Number(o.total || 0);
      totalTax += Number(o.tax || 0);
      totalDiscount += Number(o.discount || 0);
    });

    return {
      backupVersion: payload.backupVersion,
      restaurant: payload.restaurant,
      period: payload.period,
      createdAt: payload.createdAt,
      orderCount: orders.length,
      billCount: (payload.data.bills || []).length,
      grossSales: Number(grossSales.toFixed(2)),
      totalTax: Number(totalTax.toFixed(2)),
      totalDiscount: Number(totalDiscount.toFixed(2)),
      checksum: calculatedChecksum,
      isAlreadyImported: Boolean(existingImport),
      rawPayload: payload
    };
  }

  /**
   * Imports validated historical preview data into HistoricalOrder collection idempotently.
   */
  static async importHistoricalData(
    previewData: any,
    authenticatedRestaurantId: string,
    userId: string | Types.ObjectId
  ) {
    if (previewData.restaurant.id !== authenticatedRestaurantId.toString()) {
      throw new ForbiddenError('Tenant ID mismatch');
    }

    const orders = previewData.rawPayload.data.orders || [];
    if (orders.length === 0) {
      throw new ValidationError('No order records found in backup');
    }

    // Check existing records for period to prevent duplicate imports
    const fromDate = new Date(previewData.period.from);
    const toDate = new Date(previewData.period.to);

    await HistoricalOrder.deleteMany({
      restaurantId: new Types.ObjectId(authenticatedRestaurantId),
      originalCreatedAt: { $gte: fromDate, $lte: toDate }
    });

    const docs = orders.map((o: any) => ({
      restaurantId: new Types.ObjectId(authenticatedRestaurantId),
      orderNumber: o.orderNumber,
      originalCreatedAt: new Date(o.createdAt),
      items: (o.items || []).map((i: any) => ({
        dishName: i.dishName || 'Item',
        quantity: Number(i.quantity || 1),
        unitPrice: Number(i.unitPrice || 0),
        taxRate: Number(i.taxRate || 5),
        lineTotal: Number(i.lineTotal || 0)
      })),
      subtotal: Number(o.subtotal || 0),
      discount: Number(o.discount || 0),
      tax: Number(o.tax || 0),
      cgst: Number(o.cgst || 0),
      sgst: Number(o.sgst || 0),
      total: Number(o.total || 0),
      paymentMethod: o.paymentMethod || 'CASH',
      paymentStatus: o.paymentStatus || 'PAID',
      orderStatus: o.orderStatus || 'COMPLETED',
      orderSource: o.orderSource || 'IN_STORE',
      customerInfo: o.customerInfo,
      tableName: o.tableName,
      importedAt: new Date()
    }));

    await HistoricalOrder.insertMany(docs);

    await AuditLog.create({
      action: AuditAction.HISTORICAL_IMPORTED,
      restaurantId: new Types.ObjectId(authenticatedRestaurantId),
      userId: new Types.ObjectId(userId),
      details: `Imported ${docs.length} historical orders for period ${fromDate.toISOString()} - ${toDate.toISOString()}`,
      checksum: previewData.checksum
    });

    return { importedCount: docs.length };
  }
}
