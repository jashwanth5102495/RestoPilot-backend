import { Request, Response, NextFunction } from 'express';
import { TableService } from './table.service';

export class TableController {
  static async getTables(req: Request, res: Response, next: NextFunction) {
    try {
      const restaurantId = req.tenantId as string;
      const tables = await TableService.getTables(restaurantId);
      res.json({ success: true, data: tables });
    } catch (error) {
      next(error);
    }
  }

  static async updateTableCount(req: Request, res: Response, next: NextFunction) {
    try {
      const restaurantId = req.tenantId as string;
      const { count } = req.body;
      const result = await TableService.updateTableCount(restaurantId, count);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async renameTable(req: Request, res: Response, next: NextFunction) {
    try {
      const restaurantId = req.tenantId as string;
      const { id } = req.params;
      const { name } = req.body;
      const result = await TableService.renameTable(restaurantId, id as string, name as string);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}
