import mongoose from 'mongoose';
import { Restaurant } from './restaurant.model';
import { Order, OrderSource } from '../orders/order.model';
import { Ingredient } from '../ingredients/ingredient.model';
import { ForbiddenError } from '../../shared/errors/AppError';

export class RestaurantService {
  static async getBranches(restaurantId: string) {
    const currentRes = await Restaurant.findById(restaurantId);
    if (!currentRes) {
      return [];
    }
    const rootId = currentRes.parentRestaurantId || currentRes._id;

    const branches = await Restaurant.find({
      $or: [
        { _id: rootId },
        { parentRestaurantId: rootId }
      ]
    }).select('_id name city address status parentRestaurantId');
    
    return branches;
  }

  static async getBranchDashboard(restaurantId: string, branchId: string, timeframe: string = 'today') {
    const currentRes = await Restaurant.findById(restaurantId);
    if (!currentRes) {
      throw new Error('Current restaurant context not found');
    }
    const rootId = currentRes.parentRestaurantId || currentRes._id;

    let targetIds: any[] = [];

    if (branchId === 'overall') {
      const allLinkedBranches = await Restaurant.find({
        $or: [
          { _id: rootId },
          { parentRestaurantId: rootId }
        ]
      }).select('_id');
      targetIds = allLinkedBranches.map(b => b._id);
    } else {
      const isAuthorized = branchId === restaurantId || 
        (await Restaurant.exists({ _id: branchId, parentRestaurantId: rootId }));
        
      if (!isAuthorized) {
        throw new ForbiddenError('You are not authorized to access this branch dashboard');
      }
      targetIds = [new mongoose.Types.ObjectId(branchId)];
    }

    // Determine the date range based on timeframe
    let dateFilter: any = {};
    const nowFilter = new Date();
    const istTimeFilter = new Date(nowFilter.getTime() + (5.5 * 60 * 60 * 1000));
    const todayStartIST = new Date(istTimeFilter);
    todayStartIST.setUTCHours(0, 0, 0, 0);
    const todayStart = new Date(todayStartIST.getTime() - (5.5 * 60 * 60 * 1000));

    if (timeframe === 'today') {
      dateFilter = { $gte: todayStart };
    } else if (timeframe === 'yesterday') {
      const yesterdayStartIST = new Date(todayStartIST);
      yesterdayStartIST.setUTCDate(yesterdayStartIST.getUTCDate() - 1);
      const yesterdayStart = new Date(yesterdayStartIST.getTime() - (5.5 * 60 * 60 * 1000));
      dateFilter = { $gte: yesterdayStart, $lt: todayStart };
    } else if (timeframe === 'week') {
      const weekStartIST = new Date(todayStartIST);
      weekStartIST.setUTCDate(weekStartIST.getUTCDate() - weekStartIST.getUTCDay());
      const weekStart = new Date(weekStartIST.getTime() - (5.5 * 60 * 60 * 1000));
      dateFilter = { $gte: weekStart };
    } else if (timeframe === 'month') {
      const monthStartIST = new Date(todayStartIST);
      monthStartIST.setUTCDate(1);
      const monthStart = new Date(monthStartIST.getTime() - (5.5 * 60 * 60 * 1000));
      dateFilter = { $gte: monthStart };
    } else if (timeframe === 'year') {
      const yearStartIST = new Date(todayStartIST);
      yearStartIST.setUTCMonth(0, 1);
      const yearStart = new Date(yearStartIST.getTime() - (5.5 * 60 * 60 * 1000));
      dateFilter = { $gte: yearStart };
    }

    const orderMatchQuery: any = { restaurantId: { $in: targetIds } };
    if (Object.keys(dateFilter).length > 0) {
      orderMatchQuery.createdAt = dateFilter;
    }

    const [totalOrders, salesResult, lowStockItems, recentOrders, popularDishesResult, dailySalesResult] = await Promise.all([
      Order.countDocuments(orderMatchQuery),
      Order.aggregate([
        { $match: { 
          ...orderMatchQuery,
          orderStatus: { $nin: ['DRAFT', 'CANCELLED'] }
        } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Ingredient.countDocuments({ 
        restaurantId: { $in: targetIds },
        $expr: { $lte: ['$currentStock', '$minimumStock'] }
      }),
      Order.find(orderMatchQuery)
        .sort({ createdAt: -1 })
        .limit(5),
      Order.aggregate([
        { $match: { 
          ...orderMatchQuery,
          orderStatus: { $nin: ['DRAFT', 'CANCELLED'] }
        } },
        { $unwind: '$items' },
        { $group: { 
          _id: '$items.dishId', 
          name: { $first: '$items.dishName' },
          orders: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.lineTotal' }
        }},
        { $sort: { orders: -1 } },
        { $limit: 10 }
      ]),
      // Daily Sales for the last 7 days
      Order.aggregate([
        { 
          $match: { 
            restaurantId: { $in: targetIds },
            orderStatus: { $nin: ['DRAFT', 'CANCELLED'] },
            createdAt: { 
              $gte: new Date(new Date(new Date(new Date().getTime() + 5.5*60*60*1000).setUTCDate(new Date(new Date().getTime() + 5.5*60*60*1000).getUTCDate() - 6) - 5.5*60*60*1000).setUTCHours(0,0,0,0)) 
            } 
          } 
        },
        {
          $group: {
            _id: {
              year: { $year: { date: '$createdAt', timezone: '+05:30' } },
              month: { $month: { date: '$createdAt', timezone: '+05:30' } },
              day: { $dayOfMonth: { date: '$createdAt', timezone: '+05:30' } },
              dayOfWeek: { $dayOfWeek: { date: '$createdAt', timezone: '+05:30' } }
            },
            total: { $sum: '$total' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ])
    ]);

    const totalSales = salesResult.length > 0 ? salesResult[0].total : 0;
    
    // Format popular dishes to match frontend expectation
    const popularDishes = popularDishesResult.map(d => ({
      id: d._id,
      name: d.name,
      orders: d.orders,
      revenue: d.revenue
    }));

    const totalOnlineOrders = await Order.countDocuments({ 
      ...orderMatchQuery,
      orderSource: OrderSource.ONLINE 
    });

    // Process daily sales to ensure exactly last 7 days are included
    const daysMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const salesData = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      // Create date object and shift to IST for extraction
      const d = new Date(today.getTime() + (5.5 * 60 * 60 * 1000));
      d.setUTCDate(d.getUTCDate() - i);
      
      const year = d.getUTCFullYear();
      const month = d.getUTCMonth() + 1;
      const day = d.getUTCDate();
      const dayName = daysMap[d.getUTCDay()];
      
      const found = dailySalesResult.find(r => 
        r._id.year === year && 
        r._id.month === month && 
        r._id.day === day
      );
      
      salesData.push({
        name: dayName,
        total: found ? found.total : 0
      });
    }

    return {
      totalOrders,
      totalSales,
      lowStockItems,
      recentOrders,
      popularDishes,
      totalOnlineOrders,
      salesData
    };
  }

  static async createBranch(parentId: string, branchData: any) {
    const { RestaurantStatus, SubscriptionStatus } = await import('./restaurant.model');
    const parentRestaurant = await Restaurant.findById(parentId);
    if (!parentRestaurant) {
      throw new Error('Parent restaurant not found');
    }

    const branch = new Restaurant({
      name: branchData.name,
      phone: branchData.phone,
      email: branchData.email,
      address: branchData.address,
      city: branchData.city,
      state: branchData.state,
      pincode: branchData.pincode,
      restaurantType: branchData.restaurantType || parentRestaurant.restaurantType,
      parentRestaurantId: parentRestaurant._id,
      ownerId: parentRestaurant.ownerId,
      status: RestaurantStatus.ACTIVE,
      subscriptionStatus: SubscriptionStatus.ACTIVE, // Active by default for branches during testing
    });

    await branch.save();

    // Seed default categories for branch
    const defaultCategories = [
      'Starters',
      'Main Course',
      'Rice & Biryani',
      'Breads',
      'South Indian',
      'Desserts',
      'Beverages',
      'Combos & Thalis'
    ];

    const { Category } = await import('../categories/category.model');
    for (let i = 0; i < defaultCategories.length; i++) {
      const cat = new Category({
        restaurantId: branch._id,
        name: defaultCategories[i],
        description: `Default category: ${defaultCategories[i]}`,
        displayOrder: i + 1,
        isActive: true
      });
      await cat.save();
    }

    return branch;
  }
}
