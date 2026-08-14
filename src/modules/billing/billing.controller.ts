import { Request, Response, NextFunction } from 'express';
import { BillingService } from './billing.service';
import { Restaurant, SubscriptionStatus } from '../restaurants/restaurant.model';
import { DataRequest } from '../admin/data-request.model';

export class BillingController {
  static async processSale(req: Request, res: Response, next: NextFunction) {
    try {
      const { items, paymentMethod, customerId } = req.body;
      
      const result = await BillingService.processSale(
        req.tenantId!,
        req.user!.userId,
        items,
        paymentMethod,
        customerId
      );

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async paySubscription(req: Request, res: Response, next: NextFunction) {
    try {
      const restaurantId = req.user?.restaurantId;
      if (!restaurantId) return res.status(400).json({ success: false, message: 'Restaurant ID missing' });
      
      const restaurant = await Restaurant.findById(restaurantId);
      if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found' });
      
      restaurant.subscriptionStatus = SubscriptionStatus.ACTIVE;
      
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);
      restaurant.subscriptionExpiresAt = expiresAt;
      
      await restaurant.save();
      
      res.status(200).json({ success: true, data: { subscriptionStatus: restaurant.subscriptionStatus, subscriptionExpiresAt: restaurant.subscriptionExpiresAt } });
    } catch (error) {
      next(error);
    }
  }

  static async payDataRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const restaurantId = req.user?.restaurantId;
      const { month, year } = req.body;
      
      if (!restaurantId) return res.status(400).json({ success: false, message: 'Restaurant ID missing' });
      if (!month || !year) return res.status(400).json({ success: false, message: 'Month and year required' });
      
      const newRequest = new DataRequest({
        restaurantId,
        month,
        year
      });
      
      await newRequest.save();
      
      res.status(200).json({ success: true, data: newRequest });
    } catch (error) {
      next(error);
    }
  }

  static async getDataRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const restaurantId = req.user?.restaurantId;
      if (!restaurantId) return res.status(400).json({ success: false, message: 'Restaurant ID missing' });
      
      const requests = await DataRequest.find({ restaurantId }).sort({ createdAt: -1 });
      res.status(200).json({ success: true, data: requests });
    } catch (error) {
      next(error);
    }
  }
}
