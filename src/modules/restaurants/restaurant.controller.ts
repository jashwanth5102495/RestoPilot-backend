import { Request, Response, NextFunction } from 'express';
import { RestaurantService } from './restaurant.service';

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
      const dashboard = await RestaurantService.getBranchDashboard(req.tenantId as string, req.params.branchId as string);
      res.status(200).json({ success: true, data: dashboard });
    } catch (error) {
      next(error);
    }
  }
}
