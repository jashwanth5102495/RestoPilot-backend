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

  static async testWhatsappReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { Restaurant } = await import('./restaurant.model');
      const { Order, PaymentStatus, OrderStatus } = await import('../orders/order.model');
      const { Ingredient } = await import('../ingredients/ingredient.model');
      const whatsappService = (await import('../notifications/whatsapp.service')).default;
      const { PdfService } = await import('../notifications/pdf.service');
      const path = await import('path');
      const fs = await import('fs');
      const { MessageMedia } = await import('whatsapp-web.js');

      const currentRes = await Restaurant.findById(req.tenantId);
      if (!currentRes) return res.status(404).json({ success: false, message: 'Restaurant not found' });

      if (!currentRes.notificationSettings?.whatsappNumber) {
        return res.status(400).json({ success: false, message: 'No WhatsApp number configured.' });
      }

      const now = new Date();
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const salesAggregate = await Order.aggregate([
        {
          $match: {
            restaurantId: currentRes._id,
            createdAt: { $gte: startOfDay, $lte: endOfDay },
            paymentStatus: PaymentStatus.PAID,
            orderStatus: { $ne: OrderStatus.CANCELLED }
          }
        },
        {
          $group: {
            _id: '$paymentMethod',
            total: { $sum: '$total' }
          }
        }
      ]);

      let cash = 0;
      let card = 0;
      let upi = 0;
      let totalSales = 0;

      salesAggregate.forEach((item) => {
        const methodTotal = item.total || 0;
        if (item._id === 'CASH') cash += methodTotal;
        if (item._id === 'CARD') card += methodTotal;
        if (item._id === 'UPI') upi += methodTotal;
        totalSales += methodTotal;
      });

      let onlineOrdersCount = 0;
      let posOrdersCount = 0;
      
      const rawOrders = await Order.find({
        restaurantId: currentRes._id,
        createdAt: { $gte: startOfDay, $lte: endOfDay },
        paymentStatus: PaymentStatus.PAID,
        orderStatus: { $ne: OrderStatus.CANCELLED }
      });

      rawOrders.forEach(order => {
        if (order.orderSource === 'ONLINE') onlineOrdersCount++;
        else posOrdersCount++;
      });

      const ingredients = await Ingredient.find({ restaurantId: currentRes._id });
      const inventoryData = ingredients.map(ing => ({
        name: ing.name,
        quantity: ing.currentStock,
        unit: ing.unit
      }));

      const reportData = {
        restaurantName: currentRes.name,
        date: now.toLocaleDateString(),
        sales: {
          total: totalSales,
          cash,
          card,
          upi,
          onlineOrders: onlineOrdersCount,
          posOrders: posOrdersCount
        },
        inventory: inventoryData
      };

      const tempDir = path.resolve(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
      }
      const pdfPath = path.join(tempDir, `test-report-${currentRes._id}-${Date.now()}.pdf`);
      
      await PdfService.generateDailyReport(reportData, pdfPath);

      const media = MessageMedia.fromFilePath(pdfPath);
      const message = `*Daily Sales & Inventory Report (TEST)*\nRestaurant: ${currentRes.name}\nDate: ${now.toLocaleDateString()}\n\nPlease find your detailed test report attached.`;

      await whatsappService.sendMessage(currentRes.notificationSettings.whatsappNumber, message, media);
      
      fs.unlinkSync(pdfPath);

      res.status(200).json({ success: true, message: 'Test report sent successfully' });
    } catch (error) {
      next(error);
    }
  }
}
