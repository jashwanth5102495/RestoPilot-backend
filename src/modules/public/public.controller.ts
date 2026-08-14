import { Request, Response, NextFunction } from 'express';
import { Restaurant } from '../restaurants/restaurant.model';
import { Dish } from '../dishes/dish.model';
import { Order, OrderSource, OrderStatus, PaymentStatus } from '../orders/order.model';
import { Category } from '../categories/category.model';

export class PublicController {
  static async getRestaurantMenu(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const restaurant = await Restaurant.findOne({ onlineSlug: slug, isOnlineOrderingEnabled: true }).lean();
      
      if (!restaurant) {
        return res.status(404).json({ success: false, message: 'Restaurant not found or online ordering is disabled' });
      }

      const categories = await Category.find({ restaurantId: restaurant._id, isActive: true }).lean();
      const dishes = await Dish.find({ restaurantId: restaurant._id, isAvailable: true, isDeleted: false }).lean();

      res.status(200).json({
        success: true,
        data: {
          restaurant: { name: restaurant.name, logo: restaurant.logo, currency: restaurant.currency },
          categories,
          dishes
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async placeOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const { items, customerInfo } = req.body;

      const restaurant = await Restaurant.findOne({ onlineSlug: slug, isOnlineOrderingEnabled: true });
      if (!restaurant) {
        return res.status(404).json({ success: false, message: 'Restaurant not found' });
      }

      if (!items || !items.length || !customerInfo || !customerInfo.name || !customerInfo.phone) {
        return res.status(400).json({ success: false, message: 'Invalid order data' });
      }

      let subtotal = 0;
      let tax = 0;
      
      const orderItems = [];
      for (const item of items) {
        const dish = await Dish.findOne({ _id: item.dishId, restaurantId: restaurant._id });
        if (!dish || !dish.isAvailable) {
          return res.status(400).json({ success: false, message: `Dish unavailable` });
        }
        
        const lineTotal = dish.price * item.quantity;
        subtotal += lineTotal;
        tax += lineTotal * ((dish.taxRate || 0) / 100);
        
        orderItems.push({
          dishId: dish._id,
          dishName: dish.name,
          quantity: item.quantity,
          unitPrice: dish.price,
          taxRate: dish.taxRate || 0,
          lineTotal
        });
      }

      const total = subtotal + tax;
      const orderNumber = `ONL-${Math.floor(100000 + Math.random() * 900000)}`;

      const newOrder = new Order({
        restaurantId: restaurant._id,
        orderNumber,
        items: orderItems,
        subtotal,
        discount: 0,
        tax,
        total,
        orderSource: OrderSource.ONLINE,
        orderStatus: OrderStatus.PLACED,
        paymentStatus: PaymentStatus.PENDING,
        customerInfo
      });

      await newOrder.save();

      res.status(201).json({
        success: true,
        data: newOrder
      });
    } catch (error) {
      next(error);
    }
  }

  static async toggleOnlineOrdering(req: Request, res: Response, next: NextFunction) {
    try {
      const restaurantId = req.user?.restaurantId;
      const { enabled } = req.body;

      const restaurant = await Restaurant.findById(restaurantId);
      if (!restaurant) {
        return res.status(404).json({ success: false, message: 'Restaurant not found' });
      }

      restaurant.isOnlineOrderingEnabled = enabled;
      
      if (enabled && !restaurant.onlineSlug) {
        restaurant.onlineSlug = restaurant.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 1000);
      }

      await restaurant.save();

      res.status(200).json({
        success: true,
        data: restaurant
      });
    } catch (error) {
      next(error);
    }
  }
}
