import { Request, Response, NextFunction } from 'express';
import { RestaurantService } from './restaurant.service';
import { Agent } from '../admin/agent.model';

export class RestaurantController {
  static async getBranches(req: Request, res: Response, next: NextFunction) {
    try {
      const branches = await RestaurantService.getBranches(req.tenantId as string);
      res.status(200).json({ success: true, data: branches });
    } catch (error) {
      next(error);
    }
  }

  static async getBranchDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const timeframe = req.query.timeframe as string || 'today';
      const dashboard = await RestaurantService.getBranchDashboard(req.tenantId as string, req.params.branchId as string, timeframe);
      res.status(200).json({ success: true, data: dashboard });
    } catch (error) {
      next(error);
    }
  }

  static async createBranch(req: Request, res: Response, next: NextFunction) {
    try {
      const newBranch = await RestaurantService.createBranch(req.tenantId as string, req.body);
      res.status(201).json({ success: true, data: newBranch });
    } catch (error) {
      next(error);
    }
  }

  static async verifyAgent(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.body;
      if (!code) {
        return res.status(400).json({ success: false, message: 'Agent code is required' });
      }

      const agent = await Agent.findOne({ code: code.toUpperCase().trim(), status: 'ACTIVE' });
      if (!agent) {
        return res.status(400).json({ success: false, message: 'Invalid or inactive agent code' });
      }

      res.status(200).json({
        success: true,
        data: {
          isValid: true,
          agentName: agent.name
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateRestaurant(req: Request, res: Response, next: NextFunction) {
    try {
      const targetId = (req.params.id === 'current' || req.params.id === 'me' || !req.params.id) ? req.tenantId : req.params.id;
      const { name, phone, email, address, city, state, pincode, gstNumber, notificationSettings, dynamicPricing } = req.body;
      const { Restaurant } = await import('./restaurant.model');

      const currentRes = await Restaurant.findById(req.tenantId);
      if (!currentRes) return res.status(404).json({ success: false, message: 'Active restaurant context not found' });

      const rootId = currentRes.parentRestaurantId || currentRes._id;

      const targetRes = await Restaurant.findById(targetId);
      if (!targetRes) return res.status(404).json({ success: false, message: 'Restaurant not found' });

      const isAuthorized = targetRes._id.toString() === rootId.toString() || 
        targetRes._id.toString() === currentRes._id.toString() ||
        (targetRes.parentRestaurantId && targetRes.parentRestaurantId.toString() === rootId.toString());

      if (!isAuthorized) {
        return res.status(403).json({ success: false, message: 'Unauthorized to modify this restaurant profile' });
      }

      targetRes.name = name || targetRes.name;
      targetRes.phone = phone || targetRes.phone;
      targetRes.email = email || targetRes.email;
      targetRes.address = address || targetRes.address;
      targetRes.city = city || targetRes.city;
      targetRes.state = state || targetRes.state;
      targetRes.pincode = pincode || targetRes.pincode;
      targetRes.gstNumber = gstNumber || targetRes.gstNumber;

      if (notificationSettings) {
        targetRes.notificationSettings = {
          ...targetRes.notificationSettings,
          ...notificationSettings
        };
      }

      if (dynamicPricing) {
        targetRes.dynamicPricing = {
          ...targetRes.dynamicPricing,
          ...dynamicPricing
        };
      }

      await targetRes.save();

      res.status(200).json({ success: true, data: targetRes });
    } catch (error) {
      next(error);
    }
  }

  static async testTelegramReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { Restaurant } = await import('./restaurant.model');
      const { sendRestaurantShiftReport, calculateShiftRange } = await import('../notifications/cron.service');

      const { id } = req.params;
      const currentRes = await Restaurant.findById(id);
      if (!currentRes) return res.status(404).json({ success: false, message: 'Restaurant not found' });

      if (!currentRes.notificationSettings?.telegramChatId) {
        return res.status(400).json({
          success: false,
          message: 'No Telegram Chat ID configured. Please enter your Telegram Chat ID, enable notifications, and save preferences.'
        });
      }

      const requestedShift = (req.body?.shift || req.query?.shift || 'SHIFT_1').toString().toUpperCase();
      const tz = currentRes.timezone || 'Asia/Kolkata';
      const now = new Date();
      const localDateStr = now.toLocaleDateString('en-CA', { timeZone: tz });

      let startTime: Date;
      let endTime: Date;
      let shiftLabel: string;

      if (requestedShift === 'SHIFT_2') {
        const range = calculateShiftRange(
          localDateStr,
          currentRes.notificationSettings.shift2StartTime || '23:31',
          currentRes.notificationSettings.shift2EndTime || '09:59',
          true,
          tz
        );
        startTime = range.startTime;
        endTime = range.endTime;
        shiftLabel = 'Shift 2 (11:31 PM - 09:59 AM)';
      } else {
        const range = calculateShiftRange(
          localDateStr,
          currentRes.notificationSettings.shift1StartTime || '10:00',
          currentRes.notificationSettings.shift1EndTime || '23:30',
          false,
          tz
        );
        startTime = range.startTime;
        endTime = range.endTime;
        shiftLabel = 'Shift 1 (10:00 AM - 11:30 PM)';
      }

      await sendRestaurantShiftReport({
        restaurant: currentRes,
        shiftLabel,
        startTime,
        endTime,
        isTest: true,
      });

      return res.status(200).json({
        success: true,
        message: `${shiftLabel} test report sent successfully to Telegram!`
      });
    } catch (error: any) {
      console.error('Test Report Error:', error);
      if (error.message && error.message.includes('chat not found')) {
        return res.status(400).json({
          success: false,
          message: 'Telegram Chat Not Found. Please open Telegram on your phone or PC, search for our bot @rest_blu_bot, and tap START (or send /start). Then try sending the test report again.'
        });
      }
      return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    }
  }

  static async getWhatsAppStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const { WhatsAppService } = await import('../notifications/whatsapp.service');
      const status = await WhatsAppService.getStatus(id);
      res.status(200).json({ success: true, data: status });
    } catch (error) {
      next(error);
    }
  }

  static async requestWhatsAppQr(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const { WhatsAppService } = await import('../notifications/whatsapp.service');
      const status = await WhatsAppService.requestQrCode(id);
      res.status(200).json({ success: true, data: status });
    } catch (error) {
      next(error);
    }
  }

  static async disconnectWhatsApp(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const { WhatsAppService } = await import('../notifications/whatsapp.service');
      await WhatsAppService.disconnect(id);
      res.status(200).json({ success: true, message: 'WhatsApp session unlinked successfully.' });
    } catch (error) {
      next(error);
    }
  }

  static async testWhatsAppReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { Restaurant } = await import('./restaurant.model');
      const { sendRestaurantShiftReport, calculateShiftRange } = await import('../notifications/cron.service');
      const id = String(req.params.id);

      const currentRes = await Restaurant.findById(id);
      if (!currentRes) return res.status(404).json({ success: false, message: 'Restaurant not found' });

      const targetPhone = req.body?.phone || currentRes.notificationSettings?.whatsappPhoneNumber;
      if (!targetPhone) {
        return res.status(400).json({
          success: false,
          message: 'WhatsApp phone number is required. Please enter the owner WhatsApp number and save preferences.'
        });
      }

      const requestedShift = (req.body?.shift || req.query?.shift || 'SHIFT_1').toString().toUpperCase();
      const tz = currentRes.timezone || 'Asia/Kolkata';
      const now = new Date();
      const localDateStr = now.toLocaleDateString('en-CA', { timeZone: tz });

      let startTime: Date;
      let endTime: Date;
      let shiftLabel: string;

      if (requestedShift === 'SHIFT_2') {
        const range = calculateShiftRange(
          localDateStr,
          currentRes.notificationSettings?.shift2StartTime || '23:31',
          currentRes.notificationSettings?.shift2EndTime || '09:59',
          true,
          tz
        );
        startTime = range.startTime;
        endTime = range.endTime;
        shiftLabel = 'Shift 2 (11:31 PM - 09:59 AM)';
      } else {
        const range = calculateShiftRange(
          localDateStr,
          currentRes.notificationSettings?.shift1StartTime || '10:00',
          currentRes.notificationSettings?.shift1EndTime || '23:30',
          false,
          tz
        );
        startTime = range.startTime;
        endTime = range.endTime;
        shiftLabel = 'Shift 1 (10:00 AM - 11:30 PM)';
      }

      await sendRestaurantShiftReport({
        restaurant: currentRes,
        shiftLabel,
        startTime,
        endTime,
        isTest: true,
        forceChannel: 'WHATSAPP',
        overrideWhatsAppPhone: targetPhone,
      });

      return res.status(200).json({
        success: true,
        message: `${shiftLabel} report sent successfully to WhatsApp (${targetPhone})!`
      });
    } catch (error: any) {
      console.error('Test WhatsApp Report Error:', error);
      return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    }
  }
}
