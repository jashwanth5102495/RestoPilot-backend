import mongoose from 'mongoose';
import { Request, Response, NextFunction } from 'express';
import { Restaurant } from '../restaurants/restaurant.model';
import { Dish } from '../dishes/dish.model';
import { Order, OrderSource, OrderStatus, PaymentStatus, PaymentMethod } from '../orders/order.model';
import { Category } from '../categories/category.model';

export class PublicController {
  public static getRestaurantSlugFilter(slug: string | string[] | any, field: 'waiterSlug' | 'billingSlug' | 'onlineSlug' | 'kdsSlug' | 'inventorySlug' = 'waiterSlug') {
    const raw = Array.isArray(slug) ? slug[0] : (typeof slug === 'string' ? slug : '');
    const cleaned = (raw || '').trim().toLowerCase();
    const base = cleaned.replace(/-(waiter|billing|kds|order|pos|inventory)(-\d+)?$/, '');
    const isObjectId = mongoose.Types.ObjectId.isValid(cleaned);
    
    return {
      $or: [
        { [field]: cleaned },
        { [field]: base },
        { waiterSlug: cleaned },
        { waiterSlug: base },
        { billingSlug: cleaned },
        { billingSlug: base },
        { onlineSlug: cleaned },
        { onlineSlug: base },
        { kdsSlug: cleaned },
        { kdsSlug: base },
        { inventorySlug: cleaned },
        { inventorySlug: base },
        ...(isObjectId ? [{ _id: cleaned }] : [])
      ]
    };
  }

  private static async generateUniqueSlug(Model: any, baseSlug: string, field: string): Promise<string> {
    let slug = baseSlug;
    let counter = 1;
    while (await Model.exists({ [field]: slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    return slug;
  }
  static async getRestaurantMenu(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const restaurant = await Restaurant.findOne(PublicController.getRestaurantSlugFilter(slug, 'onlineSlug')).lean();
      
      if (!restaurant) {
        return res.status(404).json({ success: false, message: 'Restaurant not found or online ordering is disabled' });
      }

      const categories = await Category.find({ restaurantId: restaurant._id, isDeleted: { $ne: true }, isActive: { $ne: false } }).sort({ displayOrder: 1 }).lean();
      const dishes = await Dish.find({ restaurantId: restaurant._id, isAvailable: { $ne: false }, isDeleted: { $ne: true } })
        .populate('categoryId')
        .sort({ displayOrder: 1, createdAt: -1 })
        .lean();

      res.status(200).json({
        success: true,
        data: {
          restaurant: { 
            name: restaurant.name, 
            address: restaurant.address, 
            phone: restaurant.phone, 
            gstNumber: restaurant.gstNumber, 
            logo: restaurant.logo, 
            currency: restaurant.currency 
          },
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

      const restaurant = await Restaurant.findOne(PublicController.getRestaurantSlugFilter(slug, 'onlineSlug'));
      if (!restaurant) {
        return res.status(404).json({ success: false, message: 'Restaurant not found' });
      }

      if (!items || !items.length || !customerInfo || !customerInfo.name || !customerInfo.phone) {
        return res.status(400).json({ success: false, message: 'Invalid order data' });
      }

      let subtotal = 0;
      let cgst = 0;
      let sgst = 0;
      
      const orderItems = [];
      for (const item of items) {
        const dish = await Dish.findOne({ _id: item.dishId, restaurantId: restaurant._id });
        if (!dish || !dish.isAvailable) {
          return res.status(400).json({ success: false, message: `Dish unavailable` });
        }
        
        const lineTotal = dish.price * item.quantity;
        const lineTaxRate = dish.taxRate ?? 5;
        const lineCgst = Number(((lineTotal * (lineTaxRate / 2)) / 100).toFixed(2));
        const lineSgst = Number(((lineTotal * (lineTaxRate / 2)) / 100).toFixed(2));

        subtotal += lineTotal;
        cgst += lineCgst;
        sgst += lineSgst;
        
        orderItems.push({
          dishId: dish._id,
          dishName: dish.name,
          quantity: item.quantity,
          unitPrice: dish.price,
          taxRate: lineTaxRate,
          lineTotal
        });
      }

      subtotal = Number(subtotal.toFixed(2));
      cgst = Number(cgst.toFixed(2));
      sgst = Number(sgst.toFixed(2));
      const tax = Number((cgst + sgst).toFixed(2));
      const total = Number((subtotal + tax).toFixed(2));
      const orderNumber = `ONL-${Math.floor(100000 + Math.random() * 900000)}`;

      const newOrder = new Order({
        restaurantId: restaurant._id,
        orderNumber,
        items: orderItems,
        subtotal,
        discount: 0,
        tax,
        cgst,
        sgst,
        total,
        orderSource: OrderSource.ONLINE,
        orderStatus: OrderStatus.PLACED,
        paymentStatus: PaymentStatus.PENDING,
        customerInfo
      });

      await newOrder.save();

      try {
        const { emitToTenant } = await import('../../shared/utils/socket');
        emitToTenant(restaurant._id.toString(), 'order_sent', { order: newOrder });
        emitToTenant(restaurant._id.toString(), 'new_online_order', { order: newOrder });
      } catch (sockErr) {
        console.error('Failed to emit online order socket notification:', sockErr);
      }

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
      const reqAny = req as any;
      const restaurantId = reqAny.user?.restaurantId || reqAny.tenantId;
      const { enabled } = req.body;

      if (!restaurantId) {
        return res.status(400).json({ success: false, message: 'Restaurant context is missing' });
      }

      const restaurant = await Restaurant.findById(restaurantId);
      if (!restaurant) {
        return res.status(404).json({ success: false, message: 'Restaurant not found' });
      }

      restaurant.isOnlineOrderingEnabled = enabled;
      
      if (enabled && !restaurant.onlineSlug) {
        const baseSlug = restaurant.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        restaurant.onlineSlug = await PublicController.generateUniqueSlug(Restaurant, baseSlug, 'onlineSlug');
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

  static async toggleWaiterOrdering(req: Request, res: Response, next: NextFunction) {
    try {
      const reqAny = req as any;
      const restaurantId = reqAny.user?.restaurantId || reqAny.tenantId;
      const { enabled } = req.body;

      if (!restaurantId) {
        return res.status(400).json({ success: false, message: 'Restaurant context is missing' });
      }

      const restaurant = await Restaurant.findById(restaurantId);
      if (!restaurant) {
        return res.status(404).json({ success: false, message: 'Restaurant not found' });
      }

      restaurant.isWaiterOrderingEnabled = enabled;
      
      if (enabled && !restaurant.waiterSlug) {
        const baseSlug = restaurant.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-waiter';
        restaurant.waiterSlug = await PublicController.generateUniqueSlug(Restaurant, baseSlug, 'waiterSlug');
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

  static async toggleBillingOrdering(req: Request, res: Response, next: NextFunction) {
    try {
      const reqAny = req as any;
      const restaurantId = reqAny.user?.restaurantId || reqAny.tenantId;
      const { enabled } = req.body;

      if (!restaurantId) {
        return res.status(400).json({ success: false, message: 'Restaurant context is missing' });
      }

      const restaurant = await Restaurant.findById(restaurantId);
      if (!restaurant) {
        return res.status(404).json({ success: false, message: 'Restaurant not found' });
      }

      restaurant.isBillingEnabled = enabled;
      
      if (enabled && !restaurant.billingSlug) {
        const baseSlug = restaurant.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-billing';
        restaurant.billingSlug = await PublicController.generateUniqueSlug(Restaurant, baseSlug, 'billingSlug');
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

  static async toggleKds(req: Request, res: Response, next: NextFunction) {
    try {
      const reqAny = req as any;
      const restaurantId = reqAny.user?.restaurantId || reqAny.tenantId;
      const { enabled } = req.body;

      if (!restaurantId) {
        return res.status(400).json({ success: false, message: 'Restaurant context is missing' });
      }

      const restaurant = await Restaurant.findById(restaurantId);
      if (!restaurant) {
        return res.status(404).json({ success: false, message: 'Restaurant not found' });
      }

      restaurant.isKdsEnabled = enabled;
      
      if (enabled && !restaurant.kdsSlug) {
        const baseSlug = restaurant.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-kds';
        restaurant.kdsSlug = await PublicController.generateUniqueSlug(Restaurant, baseSlug, 'kdsSlug');
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

  static async getKdsOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const restaurant = await Restaurant.findOne(PublicController.getRestaurantSlugFilter(slug, 'kdsSlug')).lean();
      
      if (!restaurant) {
        return res.status(404).json({ success: false, message: 'KDS portal not found or disabled' });
      }

      const orders = await Order.find({ 
        restaurantId: restaurant._id, 
        orderStatus: { $in: [OrderStatus.PLACED, OrderStatus.PREPARING] } 
      }).populate('tableId', 'name').lean();

      res.status(200).json({ success: true, data: orders });
    } catch (error) {
      next(error);
    }
  }

  static async updateKdsOrderStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug, orderId } = req.params;
      const { status } = req.body;

      const restaurant = await Restaurant.findOne(PublicController.getRestaurantSlugFilter(slug, 'kdsSlug'));
      if (!restaurant) {
        return res.status(404).json({ success: false, message: 'KDS portal not found or disabled' });
      }

      const { OrderService } = await import('../orders/order.service');
      const order = await OrderService.updateOrderStatus(restaurant._id.toString(), orderId as string, status as OrderStatus, null as any);

      res.status(200).json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  }

  static async getWaiterTables(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const restaurant = await Restaurant.findOne(PublicController.getRestaurantSlugFilter(slug, 'waiterSlug')).lean();
      
      if (!restaurant) {
        return res.status(404).json({ success: false, message: 'Waiter portal not found or disabled' });
      }

      const { Table } = await import('../tables/table.model');
      const tables = await Table.find({ restaurantId: restaurant._id, isActive: true }).sort({ tableNumber: 1 }).lean();

      res.status(200).json({ success: true, data: { restaurant: { name: restaurant.name, address: restaurant.address, phone: restaurant.phone, gstNumber: restaurant.gstNumber }, tables } });
    } catch (error) {
      next(error);
    }
  }

  static async getWaiterMenu(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const restaurant = await Restaurant.findOne(PublicController.getRestaurantSlugFilter(slug, 'waiterSlug')).lean();
      
      if (!restaurant) {
        return res.status(404).json({ success: false, message: 'Waiter portal not found or disabled' });
      }

      const categories = await Category.find({ restaurantId: restaurant._id, isDeleted: { $ne: true }, isActive: { $ne: false } }).sort({ displayOrder: 1 }).lean();
      const dishes = await Dish.find({ restaurantId: restaurant._id, isAvailable: { $ne: false }, isDeleted: { $ne: true } })
        .populate('categoryId')
        .sort({ displayOrder: 1, createdAt: -1 })
        .lean();

      res.status(200).json({ success: true, data: { categories, dishes } });
    } catch (error) {
      next(error);
    }
  }

  static async getWaiterTableOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug, tableId } = req.params;
      
      const restaurant = await Restaurant.findOne(PublicController.getRestaurantSlugFilter(slug, 'waiterSlug')).lean();
      if (!restaurant) {
        return res.status(404).json({ success: false, message: 'Waiter portal not found or disabled' });
      }

      const order = await Order.findOne({ 
        restaurantId: restaurant._id, 
        tableId: tableId as string, 
        orderStatus: { $nin: [OrderStatus.COMPLETED, OrderStatus.CANCELLED] } 
      }).lean();

      res.status(200).json({ success: true, data: order || null });
    } catch (error) {
      next(error);
    }
  }

  static async placeWaiterTableOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug, tableId } = req.params;
      const { items } = req.body;

      const restaurant = await Restaurant.findOne(PublicController.getRestaurantSlugFilter(slug, 'waiterSlug'));
      if (!restaurant) {
        return res.status(404).json({ success: false, message: 'Waiter portal not found or disabled' });
      }

      const { OrderService } = await import('../orders/order.service');

      // Check if table has active order, if not start one
      let order = await Order.findOne({ 
        restaurantId: restaurant._id, 
        tableId: tableId as string, 
        orderStatus: { $nin: [OrderStatus.COMPLETED, OrderStatus.CANCELLED] } 
      });

      if (!order) {
        order = await OrderService.startTableOrder(restaurant._id.toString(), tableId as string, null as any);
      }

      // Update items
      if (items && items.length > 0) {
        order = await OrderService.updateOrderItems(restaurant._id.toString(), order._id.toString(), items, null as any);
      }

      // Send to kitchen
      order = await OrderService.sendOrder(restaurant._id.toString(), order._id.toString(), null as any);

      res.status(200).json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  }

  static async generateWaiterBill(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug, tableId } = req.params;
      
      const restaurant = await Restaurant.findOne(PublicController.getRestaurantSlugFilter(slug, 'waiterSlug'));
      if (!restaurant) {
        return res.status(404).json({ success: false, message: 'Waiter portal not found or disabled' });
      }

      const order = await Order.findOne({ 
        restaurantId: restaurant._id, 
        tableId: tableId as string, 
        orderStatus: { $nin: [OrderStatus.COMPLETED, OrderStatus.CANCELLED] } 
      });

      if (!order) {
        return res.status(404).json({ success: false, message: 'No active order found for this table' });
      }

      const { OrderService } = await import('../orders/order.service');
      const updatedOrder = await OrderService.updateOrderStatus(restaurant._id.toString(), order._id.toString(), OrderStatus.COMPLETED, null as any);

      res.status(200).json({ success: true, data: updatedOrder });
    } catch (error) {
      next(error);
    }
  }

  static async getBillingMenu(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const restaurant = await Restaurant.findOne(PublicController.getRestaurantSlugFilter(slug, 'billingSlug')).lean();
      
      if (!restaurant) {
        return res.status(404).json({ success: false, message: 'Billing portal not found or disabled' });
      }

      const categories = await Category.find({ restaurantId: restaurant._id, isDeleted: { $ne: true }, isActive: { $ne: false } }).sort({ displayOrder: 1 }).lean();
      const dishes = await Dish.find({ restaurantId: restaurant._id, isAvailable: { $ne: false }, isDeleted: { $ne: true } })
        .populate('categoryId')
        .sort({ displayOrder: 1, createdAt: -1 })
        .lean();

      res.status(200).json({ success: true, data: { restaurant: { name: restaurant.name, address: restaurant.address, phone: restaurant.phone, gstNumber: restaurant.gstNumber, logo: restaurant.logo, currency: restaurant.currency }, categories, dishes } });
    } catch (error) {
      next(error);
    }
  }

  static async processBillingSale(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const { items, paymentMethod, customerId } = req.body;

      const restaurant = await Restaurant.findOne(PublicController.getRestaurantSlugFilter(slug, 'billingSlug'));
      if (!restaurant) {
        return res.status(404).json({ success: false, message: 'Billing portal not found or disabled' });
      }

      const { BillingService } = await import('../billing/billing.service');
      
      // Pass restaurant._id and restaurant.ownerId (or string) as userId
      const userId = restaurant.ownerId || restaurant._id;

      const result = await BillingService.processSale(
        restaurant._id as any,
        userId as any,
        items,
        paymentMethod,
        customerId
      );

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getBillingTables(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const restaurant = await Restaurant.findOne(PublicController.getRestaurantSlugFilter(slug, 'billingSlug')).lean();
      
      if (!restaurant) {
        return res.status(404).json({ success: false, message: 'Billing portal not found or disabled' });
      }

      const { Table } = await import('../tables/table.model');
      const tables = await Table.find({ restaurantId: restaurant._id, isActive: true }).sort({ tableNumber: 1 }).lean();
      
      const activeOrders = await Order.find({ 
        restaurantId: restaurant._id, 
        tableId: { $in: tables.map(t => t._id) },
        orderStatus: { $nin: [OrderStatus.COMPLETED, OrderStatus.CANCELLED] }
      }).lean();

      res.status(200).json({ 
        success: true, 
        data: { 
          tables,
          activeOrders 
        } 
      });
    } catch (error) {
      next(error);
    }
  }

  static async getBillingTableOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug, tableId } = req.params;
      
      const restaurant = await Restaurant.findOne(PublicController.getRestaurantSlugFilter(slug, 'billingSlug'));
      if (!restaurant) {
        return res.status(404).json({ success: false, message: 'Billing portal not found or disabled' });
      }

      const order = await Order.findOne({ 
        restaurantId: restaurant._id, 
        tableId: tableId as string, 
        orderStatus: { $nin: [OrderStatus.COMPLETED, OrderStatus.CANCELLED] } 
      });

      res.status(200).json({ success: true, data: order || null });
    } catch (error) {
      next(error);
    }
  }

  static async settleBillingTableOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug, tableId } = req.params;
      const { paymentMethod } = req.body;
      
      const restaurant = await Restaurant.findOne(PublicController.getRestaurantSlugFilter(slug, 'billingSlug'));
      if (!restaurant) {
        return res.status(404).json({ success: false, message: 'Billing portal not found or disabled' });
      }

      const order = await Order.findOne({ 
        restaurantId: restaurant._id, 
        tableId: tableId as string, 
        orderStatus: { $nin: [OrderStatus.COMPLETED, OrderStatus.CANCELLED] } 
      });

      if (!order) {
        return res.status(404).json({ success: false, message: 'No active order found for this table' });
      }

      const { OrderService } = await import('../orders/order.service');
      const updatedOrder = await OrderService.updateOrderStatus(restaurant._id.toString(), order._id.toString(), OrderStatus.COMPLETED, null as any);
      
      updatedOrder.paymentStatus = PaymentStatus.PAID;
      updatedOrder.paymentMethod = paymentMethod || 'CASH';
      await updatedOrder.save();

      const { emitToTenant } = await import('../../shared/utils/socket');
      emitToTenant(restaurant._id.toString(), 'order_status_updated', updatedOrder);

      res.status(200).json({ success: true, data: updatedOrder });
    } catch (error) {
      next(error);
    }
  }

  static async toggleDishAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug, dishId } = req.params;
      const { isAvailable } = req.body;

      const restaurant = await Restaurant.findOne(PublicController.getRestaurantSlugFilter(slug, 'billingSlug'));
      if (!restaurant) {
        return res.status(404).json({ success: false, message: 'Billing portal not found or disabled' });
      }

      const dish = await Dish.findOne({ _id: dishId, restaurantId: restaurant._id });
      if (!dish) {
        return res.status(404).json({ success: false, message: 'Dish not found' });
      }

      dish.isAvailable = isAvailable;
      await dish.save();

      res.status(200).json({ success: true, data: dish });
    } catch (error) {
      next(error);
    }
  }

  static async getBillingOnlineOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const restaurant = await Restaurant.findOne(PublicController.getRestaurantSlugFilter(slug, 'billingSlug')).lean();
      if (!restaurant) {
        return res.status(404).json({ success: false, message: 'Billing portal not found or disabled' });
      }

      const orders = await Order.find({
        restaurantId: restaurant._id,
        orderSource: OrderSource.ONLINE
      }).sort({ createdAt: -1 }).limit(100).lean();

      res.status(200).json({ success: true, data: orders });
    } catch (error) {
      next(error);
    }
  }

  static async settleBillingOnlineOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug, orderId } = req.params;
      const { paymentMethod } = req.body;

      const restaurant = await Restaurant.findOne(PublicController.getRestaurantSlugFilter(slug, 'billingSlug'));
      if (!restaurant) {
        return res.status(404).json({ success: false, message: 'Billing portal not found or disabled' });
      }

      const order = await Order.findOne({
        _id: orderId,
        restaurantId: restaurant._id,
        orderSource: OrderSource.ONLINE
      });

      if (!order) {
        return res.status(404).json({ success: false, message: 'Online order not found' });
      }

      const { OrderService } = await import('../orders/order.service');
      const updatedOrder = await OrderService.updateOrderStatus(restaurant._id.toString(), order._id.toString(), OrderStatus.COMPLETED, null as any);

      updatedOrder.paymentStatus = PaymentStatus.PAID;
      updatedOrder.paymentMethod = paymentMethod || PaymentMethod.CASH;
      await updatedOrder.save();

      const { emitToTenant } = await import('../../shared/utils/socket');
      emitToTenant(restaurant._id.toString(), 'order_status_updated', { order: updatedOrder });

      res.status(200).json({ success: true, data: updatedOrder });
    } catch (error) {
      next(error);
    }
  }

  static async updateBillingOnlineOrderStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug, orderId } = req.params;
      const { status } = req.body;

      const restaurant = await Restaurant.findOne(PublicController.getRestaurantSlugFilter(slug, 'billingSlug'));
      if (!restaurant) {
        return res.status(404).json({ success: false, message: 'Billing portal not found or disabled' });
      }

      const { OrderService } = await import('../orders/order.service');
      const order = await OrderService.updateOrderStatus(restaurant._id.toString(), orderId as string, status as OrderStatus, null as any);

      res.status(200).json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  }

  static async toggleInventory(req: Request, res: Response, next: NextFunction) {
    try {
      const reqAny = req as any;
      const restaurantId = reqAny.user?.restaurantId || reqAny.tenantId;
      const { enabled } = req.body;

      if (!restaurantId) {
        return res.status(400).json({ success: false, message: 'Restaurant context is missing' });
      }

      const restaurant = await Restaurant.findById(restaurantId);
      if (!restaurant) {
        return res.status(404).json({ success: false, message: 'Restaurant not found' });
      }

      restaurant.isInventoryEnabled = enabled;
      
      if (enabled && !restaurant.inventorySlug) {
        const baseSlug = restaurant.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-inventory';
        restaurant.inventorySlug = await PublicController.generateUniqueSlug(Restaurant, baseSlug, 'inventorySlug');
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

  static async getInventoryMenu(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const restaurant = await Restaurant.findOne(PublicController.getRestaurantSlugFilter(slug, 'inventorySlug')).lean();
      
      if (!restaurant) {
        return res.status(404).json({ success: false, message: 'Inventory portal not found or disabled' });
      }

      const { Ingredient } = await import('../ingredients/ingredient.model');
      const ingredients = await Ingredient.find({ restaurantId: restaurant._id }).sort({ name: 1 }).lean();

      res.status(200).json({ success: true, data: { restaurant: { name: restaurant.name, address: restaurant.address, logo: restaurant.logo, currency: restaurant.currency }, ingredients } });
    } catch (error) {
      next(error);
    }
  }

  static async processInventoryRestock(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const { items } = req.body; // Array of { ingredientId, quantity, unit, unitCost }

      const restaurant = await Restaurant.findOne(PublicController.getRestaurantSlugFilter(slug, 'inventorySlug'));
      if (!restaurant) {
        return res.status(404).json({ success: false, message: 'Inventory portal not found or disabled' });
      }

      if (!items || !items.length) {
        return res.status(400).json({ success: false, message: 'No items provided' });
      }

      const { Purchase } = await import('../purchases/purchase.model');
      const { Ingredient } = await import('../ingredients/ingredient.model');

      let subtotal = 0;
      const purchaseItems = items.map((item: any) => {
        const cost = Number(item.quantity) * Number(item.unitCost || 0);
        subtotal += cost;
        return {
          ingredientId: item.ingredientId,
          quantity: Number(item.quantity),
          unitCost: Number(item.unitCost || 0),
          unit: item.unit,
          lineTotal: cost
        };
      });
      
      const purchaseNumber = `PO-${Math.floor(100000 + Math.random() * 900000)}`;

      const purchase = new Purchase({
        restaurantId: restaurant._id,
        purchaseNumber,
        purchaseDate: new Date(),
        items: purchaseItems,
        subtotal: subtotal,
        tax: 0,
        total: subtotal,
        paymentStatus: 'PAID',
        notes: 'Inventory quick public adjustment',
        createdBy: restaurant.ownerId || restaurant._id,
      });

      await purchase.save();

      // Update ingredient stocks directly
      for (const item of purchaseItems) {
        const ingredient = await Ingredient.findOne({ _id: item.ingredientId, restaurantId: restaurant._id });
        if (ingredient) {
          ingredient.currentStock += item.quantity;
          await ingredient.save();
        }
      }

      res.status(201).json({ success: true, data: purchase });
    } catch (error) {
      next(error);
    }
  }
}
