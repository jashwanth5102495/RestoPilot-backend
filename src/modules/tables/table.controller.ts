import { Request, Response, NextFunction } from 'express';
import { TableService } from './table.service';
import { getTenantId } from '../../shared/utils/tenant';

export class TableController {
  static async getTables(req: Request, res: Response, next: NextFunction) {
    try {
      const restaurantId = getTenantId(req);
      const tables = await TableService.getTables(restaurantId);
      res.json({ success: true, data: tables });
    } catch (error) {
      next(error);
    }
  }

  static async updateTableCount(req: Request, res: Response, next: NextFunction) {
    try {
      const restaurantId = getTenantId(req);
      const { count } = req.body;
      const result = await TableService.updateTableCount(restaurantId, parseInt(count, 10));
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}
