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
      const dashboard = await RestaurantService.getBranchDashboard(req.tenantId as string, req.params.branchId as string);
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
}
