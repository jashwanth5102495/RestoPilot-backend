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
      const { id } = req.params;
      const { name, phone, email, address, city, state, pincode, gstNumber, notificationSettings } = req.body;
      const { Restaurant } = await import('./restaurant.model');

      const currentRes = await Restaurant.findById(req.tenantId);
      if (!currentRes) return res.status(404).json({ success: false, message: 'Active restaurant context not found' });

      const rootId = currentRes.parentRestaurantId || currentRes._id;

      const targetRes = await Restaurant.findById(id);
      if (!targetRes) return res.status(404).json({ success: false, message: 'Restaurant not found' });

      const isAuthorized = targetRes._id.toString() === rootId.toString() || 
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

      await targetRes.save();

      res.status(200).json({ success: true, data: targetRes });
    } catch (error) {
      next(error);
    }
  }
}
