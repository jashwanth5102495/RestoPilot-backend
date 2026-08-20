import { Restaurant } from './restaurant.model';
import { Order } from '../orders/order.model';
import { Ingredient } from '../ingredients/ingredient.model';
import { ForbiddenError } from '../../shared/errors/AppError';

export class RestaurantService {
  static async getBranches(restaurantId: string) {
    const branches = await Restaurant.find({
      $or: [
        { _id: restaurantId },
        { parentRestaurantId: restaurantId }
      ]
    }).select('_id name city address status parentRestaurantId');
    
    return branches;
  }

  static async getBranchDashboard(restaurantId: string, branchId: string) {
    const isAuthorized = branchId === restaurantId || 
      (await Restaurant.exists({ _id: branchId, parentRestaurantId: restaurantId }));
      
    if (!isAuthorized) {
      throw new ForbiddenError('You are not authorized to access this branch dashboard');
    }

    const [totalOrders, salesResult, lowStockItems, recentOrders] = await Promise.all([
      Order.countDocuments({ restaurantId: branchId }),
      Order.aggregate([
        { $match: { restaurantId: branchId } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Ingredient.countDocuments({ 
        restaurantId: branchId,
        $expr: { $lte: ['$currentStock', '$minimumStock'] }
      }),
      Order.find({ restaurantId: branchId })
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    const totalSales = salesResult.length > 0 ? salesResult[0].total : 0;

    return {
      totalOrders,
      totalSales,
      lowStockItems,
      recentOrders
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
    return branch;
  }
}
