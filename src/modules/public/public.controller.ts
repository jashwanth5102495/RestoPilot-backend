import { Request, Response, NextFunction } from 'express';
import { Restaurant } from '../restaurants/restaurant.model';
import { Dish } from '../dishes/dish.model';
import { Order, OrderSource, OrderStatus, PaymentStatus } from '../orders/order.model';
import { Category } from '../categories/category.model';

export class PublicController {
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
      const restaurant = await Restaurant.findOne({ kdsSlug: slug, isKdsEnabled: true }).lean();
      
      if (!restaurant) {
        return res.status(404).json({ success: false, message: 'KDS portal not found or disabled' });
      }

      const orders = await Order.find({ 
        restaurantId: restaurant._id, 
        orderStatus: { $in: [OrderStatus.PLACED, OrderStatus.PREPARING] } 
      }).lean();

      res.status(200).json({ success: true, data: orders });
    } catch (error) {
      next(error);
    }
  }

  static async updateKdsOrderStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug, orderId } = req.params;
      const { status } = req.body;

      const restaurant = await Restaurant.findOne({ kdsSlug: slug, isKdsEnabled: true });
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
      const restaurant = await Restaurant.findOne({ waiterSlug: slug, isWaiterOrderingEnabled: true }).lean();
      
      if (!restaurant) {
        return res.status(404).json({ success: false, message: 'Waiter portal not found or disabled' });
      }

      const { Table } = await import('../tables/table.model');
      const tables = await Table.find({ restaurantId: restaurant._id, isActive: true }).sort({ tableNumber: 1 }).lean();

      res.status(200).json({ success: true, data: { restaurant: { name: restaurant.name }, tables } });
    } catch (error) {
      next(error);
    }
  }

  static async getWaiterMenu(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const restaurant = await Restaurant.findOne({ waiterSlug: slug, isWaiterOrderingEnabled: true }).lean();
      
      if (!restaurant) {
        return res.status(404).json({ success: false, message: 'Waiter portal not found or disabled' });
      }

      const categories = await Category.find({ restaurantId: restaurant._id, isActive: true }).lean();
      const dishes = await Dish.find({ restaurantId: restaurant._id, isAvailable: true, isDeleted: false })
        .populate('categoryId')
        .lean();

      res.status(200).json({ success: true, data: { categories, dishes } });
    } catch (error) {
      next(error);
    }
  }

  static async getWaiterTableOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug, tableId } = req.params;
      
      const restaurant = await Restaurant.findOne({ waiterSlug: slug, isWaiterOrderingEnabled: true });
      if (!restaurant) {
        return res.status(404).json({ success: false, message: 'Waiter portal not found or disabled' });
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

  static async placeWaiterTableOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug, tableId } = req.params;
      const { items } = req.body;

      const restaurant = await Restaurant.findOne({ waiterSlug: slug, isWaiterOrderingEnabled: true });
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
        order = await OrderService.startTableOrder(restaurant._id.toString(), tableId as string, null as any); // no user id since public waiter
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
      
      const restaurant = await Restaurant.findOne({ waiterSlug: slug, isWaiterOrderingEnabled: true });
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
      const restaurant = await Restaurant.findOne({ billingSlug: slug, isBillingEnabled: true }).lean();
      
      if (!restaurant) {
        return res.status(404).json({ success: false, message: 'Billing portal not found or disabled' });
      }

      const categories = await Category.find({ restaurantId: restaurant._id, isActive: true }).lean();
      const dishes = await Dish.find({ restaurantId: restaurant._id, isAvailable: true, isDeleted: false })
        .populate('categoryId')
        .lean();

      res.status(200).json({ success: true, data: { restaurant: { name: restaurant.name, logo: restaurant.logo, currency: restaurant.currency }, categories, dishes } });
    } catch (error) {
      next(error);
    }
  }

  static async processBillingSale(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const { items, paymentMethod, customerId } = req.body;

      const restaurant = await Restaurant.findOne({ billingSlug: slug, isBillingEnabled: true });
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

  static async toggleDishAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug, dishId } = req.params;
      const { isAvailable } = req.body;

      const restaurant = await Restaurant.findOne({ billingSlug: slug, isBillingEnabled: true });
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
      const restaurant = await Restaurant.findOne({ inventorySlug: slug, isInventoryEnabled: true }).lean();
      
      if (!restaurant) {
        return res.status(404).json({ success: false, message: 'Inventory portal not found or disabled' });
      }

      const { Ingredient } = await import('../ingredients/ingredient.model');
      const ingredients = await Ingredient.find({ restaurantId: restaurant._id }).sort({ name: 1 }).lean();

      res.status(200).json({ success: true, data: { restaurant: { name: restaurant.name, logo: restaurant.logo, currency: restaurant.currency }, ingredients } });
    } catch (error) {
      next(error);
    }
  }

  static async processInventoryRestock(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const { items } = req.body; // Array of { ingredientId, quantity, unit, unitCost }

      const restaurant = await Restaurant.findOne({ inventorySlug: slug, isInventoryEnabled: true });
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
