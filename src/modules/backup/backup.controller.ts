import { Request, Response, NextFunction } from 'express';
import { BackupService } from './backup.service';
import { BackupRecord, BackupType } from './backup-record.model';
import { HistoricalOrder } from './historical-order.model';
import { AuditLog } from './audit-log.model';
import { Order } from '../orders/order.model';
import { Restaurant } from '../restaurants/restaurant.model';
import { AppError, ForbiddenError, ValidationError } from '../../shared/errors/AppError';

export class BackupController {
  // Admin: Generate Backup for a restaurant & date range
  static async generateBackup(req: Request, res: Response, next: NextFunction) {
    try {
      const { restaurantId, periodStart, periodEnd, backupType } = req.body;
      const reqAny = req as any;

      if (!restaurantId || !periodStart || !periodEnd) {
        return res.status(400).json({ success: false, message: 'restaurantId, periodStart, and periodEnd are required' });
      }

      const result = await BackupService.generateBackup(
        restaurantId,
        new Date(periodStart),
        new Date(periodEnd),
        backupType || BackupType.WEEKLY,
        reqAny.user.userId
      );

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  // Admin: Get all backup records
  static async getBackups(req: Request, res: Response, next: NextFunction) {
    try {
      const { restaurantId } = req.query;
      const query: any = {};
      if (restaurantId) query.restaurantId = restaurantId;

      const backups = await BackupRecord.find(query)
        .populate('restaurantId', 'name')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .lean();

      res.status(200).json({ success: true, data: backups });
    } catch (error) {
      next(error);
    }
  }

  // Admin: Download Backup File
  static async downloadBackup(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const backupRecord = await BackupRecord.findById(id);
      if (!backupRecord) return res.status(404).json({ success: false, message: 'Backup record not found' });

      // Generate payload on the fly with verified checksum
      const { fileContent, checksum } = await BackupService.generateBackup(
        backupRecord.restaurantId.toString(),
        backupRecord.periodStart,
        backupRecord.periodEnd,
        backupRecord.backupType,
        (req as any).user.userId
      );

      const filename = `${backupRecord.backupId}.json`;
      res.setHeader('Content-disposition', `attachment; filename=${filename}`);
      res.setHeader('Content-type', 'application/json');
      res.setHeader('X-Checksum-SHA256', checksum);
      res.send(fileContent);
    } catch (error) {
      next(error);
    }
  }

  // Admin: Execute Monthly Archival & Safe Server Data Deletion
  static async executeMonthlyArchive(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { confirmationText, restaurantId } = req.body;
      const reqAny = req as any;

      if (!confirmationText) {
        return res.status(400).json({ success: false, message: 'Confirmation text is required' });
      }

      const backupRecord = await BackupRecord.findById(id);
      if (!backupRecord) return res.status(404).json({ success: false, message: 'Backup record not found' });

      const targetRestaurantId = restaurantId || backupRecord.restaurantId.toString();

      const result = await BackupService.executeMonthlyArchive(
        targetRestaurantId,
        backupRecord._id.toString(),
        confirmationText,
        reqAny.user.userId
      );

      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  // Owner: Data Overview Summary (Active vs Historical Counts)
  static async getDataSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const reqAny = req as any;
      const restaurantId = reqAny.tenantId || reqAny.user.restaurantId;
      if (!restaurantId) return res.status(400).json({ success: false, message: 'Restaurant context missing' });

      const activeOrdersCount = await Order.countDocuments({ restaurantId });
      const historicalOrdersCount = await HistoricalOrder.countDocuments({ restaurantId });
      const backupsCount = await BackupRecord.countDocuments({ restaurantId });

      res.status(200).json({
        success: true,
        data: {
          activeOrdersCount,
          historicalOrdersCount,
          backupsCount
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Owner: Upload & Validate Backup File (Preview before import)
  static async uploadAndPreviewBackup(req: Request, res: Response, next: NextFunction) {
    try {
      const reqAny = req as any;
      const restaurantId = reqAny.tenantId || reqAny.user.restaurantId;
      const { fileContent } = req.body;

      if (!fileContent) {
        return res.status(400).json({ success: false, message: 'File content is required' });
      }

      const preview = await BackupService.validateAndPreviewUpload(fileContent, restaurantId, reqAny.user.userId);
      res.status(200).json({ success: true, data: preview });
    } catch (error) {
      next(error);
    }
  }

  // Owner: Import Validated Historical Data
  static async importHistoricalData(req: Request, res: Response, next: NextFunction) {
    try {
      const reqAny = req as any;
      const restaurantId = reqAny.tenantId || reqAny.user.restaurantId;
      const { previewData } = req.body;

      if (!previewData || !previewData.rawPayload) {
        return res.status(400).json({ success: false, message: 'Valid preview data required' });
      }

      const result = await BackupService.importHistoricalData(previewData, restaurantId, reqAny.user.userId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  // Owner: Get imported historical months list
  static async getHistoricalMonths(req: Request, res: Response, next: NextFunction) {
    try {
      const reqAny = req as any;
      const restaurantId = reqAny.tenantId || reqAny.user.restaurantId;

      const archives = await HistoricalOrder.aggregate([
        { $match: { restaurantId: new Restaurant()._id.constructor(restaurantId) } },
        {
          $group: {
            _id: {
              year: { $year: '$originalCreatedAt' },
              month: { $month: '$originalCreatedAt' }
            },
            orderCount: { $sum: 1 },
            totalSales: { $sum: '$total' },
            totalTax: { $sum: '$tax' },
            totalDiscount: { $sum: '$discount' },
            firstDate: { $min: '$originalCreatedAt' },
            lastDate: { $max: '$originalCreatedAt' }
          }
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } }
      ]);

      res.status(200).json({ success: true, data: archives });
    } catch (error) {
      next(error);
    }
  }

  // Owner: Get historical dashboard and orders for a specific month/period
  static async getHistoricalMonthDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const reqAny = req as any;
      const restaurantId = reqAny.tenantId || reqAny.user.restaurantId;
      const { year, month } = req.query;

      if (!year || !month) {
        return res.status(400).json({ success: false, message: 'Year and month required' });
      }

      const start = new Date(Number(year), Number(month) - 1, 1);
      const end = new Date(Number(year), Number(month), 0, 23, 59, 59, 999);

      const orders = await HistoricalOrder.find({
        restaurantId,
        originalCreatedAt: { $gte: start, $lte: end }
      }).sort({ originalCreatedAt: -1 }).lean();

      let grossSales = 0;
      let totalTax = 0;
      let totalDiscount = 0;
      const paymentMethods: Record<string, number> = {};

      orders.forEach(o => {
        grossSales += o.total || 0;
        totalTax += o.tax || 0;
        totalDiscount += o.discount || 0;
        const method = o.paymentMethod || 'CASH';
        paymentMethods[method] = (paymentMethods[method] || 0) + (o.total || 0);
      });

      res.status(200).json({
        success: true,
        data: {
          period: { year: Number(year), month: Number(month), start, end },
          summary: {
            orderCount: orders.length,
            grossSales: Number(grossSales.toFixed(2)),
            totalTax: Number(totalTax.toFixed(2)),
            totalDiscount: Number(totalDiscount.toFixed(2)),
            avgOrderValue: orders.length > 0 ? Number((grossSales / orders.length).toFixed(2)) : 0,
            paymentMethods
          },
          orders
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Owner: Get Audit Trail Logs
  static async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const reqAny = req as any;
      const restaurantId = reqAny.tenantId || reqAny.user.restaurantId;

      const logs = await AuditLog.find({ restaurantId })
        .populate('userId', 'name email role')
        .sort({ timestamp: -1 })
      res.status(200).json({ success: true, data: logs });
    } catch (error) {
      next(error);
    }
  }

  // Owner: Download current restaurant's sales data backup directly
  static async exportOwnerData(req: Request, res: Response, next: NextFunction) {
    try {
      const reqAny = req as any;
      const restaurantId = reqAny.tenantId || reqAny.user.restaurantId;
      const { periodStart, periodEnd, backupType } = req.body;

      if (!restaurantId) return res.status(400).json({ success: false, message: 'Restaurant context missing' });

      const start = periodStart ? new Date(periodStart) : new Date(0);
      const end = periodEnd ? new Date(periodEnd) : new Date();

      const { backupRecord, fileContent, checksum } = await BackupService.generateBackup(
        restaurantId,
        start,
        end,
        backupType || BackupType.MANUAL,
        reqAny.user.userId
      );

      const filename = `${backupRecord.backupId}.json`;
      res.setHeader('Content-disposition', `attachment; filename=${filename}`);
      res.setHeader('Content-type', 'application/json');
      res.setHeader('X-Checksum-SHA256', checksum);
      res.send(fileContent);
    } catch (error) {
      next(error);
    }
  }
}
