import { Request, Response, NextFunction } from 'express';
import { StaffService } from './staff.service';

export class StaffController {
  static async createStaff(req: Request, res: Response, next: NextFunction) {
    try {
      const restaurantId = req.tenantId as string;
      const staff = await StaffService.createStaff(restaurantId, req.body);
      res.status(201).json({ success: true, data: staff });
    } catch (error) {
      next(error);
    }
  }

  static async getStaff(req: Request, res: Response, next: NextFunction) {
    try {
      const restaurantId = req.tenantId as string;
      const staff = await StaffService.getStaff(restaurantId);
      res.json({ success: true, data: staff });
    } catch (error) {
      next(error);
    }
  }

  static async updateStaff(req: Request, res: Response, next: NextFunction) {
    try {
      const restaurantId = req.tenantId as string;
      const { id } = req.params;
      const staff = await StaffService.updateStaff(restaurantId, id as string, req.body);
      res.json({ success: true, data: staff });
    } catch (error) {
      next(error);
    }
  }

  static async resetPin(req: Request, res: Response, next: NextFunction) {
    try {
      const restaurantId = req.tenantId as string;
      const { id } = req.params;
      const { pin } = req.body;
      const result = await StaffService.resetPin(restaurantId, id as string, pin);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}
