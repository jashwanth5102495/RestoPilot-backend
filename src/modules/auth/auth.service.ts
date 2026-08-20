import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User, UserRole, UserStatus } from '../users/user.model';
import { Restaurant, RestaurantStatus } from '../restaurants/restaurant.model';
import { env } from '../../config/env';
import { UnauthorizedError, ValidationError } from '../../shared/errors/AppError';

export class AuthService {
  static async login(email: string, password: string) {
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedError('Invalid credentials or inactive account');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const payload = {
      userId: user._id.toString(),
      restaurantId: user.restaurantId?.toString(),
      role: user.role,
    };

    const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRES_IN as any });
    const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN as any });

    user.lastLoginAt = new Date();
    await user.save();

    const { passwordHash, ...userWithoutPassword } = user.toObject();

    let restaurantData = null;
    if (user.restaurantId) {
      const { Restaurant } = await import('../restaurants/restaurant.model');
      restaurantData = await Restaurant.findById(user.restaurantId).lean();
    }

    return {
      user: { ...userWithoutPassword, restaurant: restaurantData },
      accessToken,
      refreshToken,
    };
  }

  static async registerRestaurant(data: any) {
    // Transaction to ensure both restaurant and owner are created together
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Check if user already exists
      const existingUser = await User.findOne({ email: data.email.toLowerCase() }).session(session);
      if (existingUser) {
        throw new ValidationError('Email is already registered');
      }

      // 2. Create Restaurant
      const restaurant = new Restaurant({
        name: data.restaurantName,
        phone: data.phone,
        email: data.email,
        address: data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        restaurantType: data.restaurantType,
        status: RestaurantStatus.ACTIVE,
      });

      await restaurant.save({ session });

      // 3. Create Owner User
      const passwordHash = await bcrypt.hash(data.password, 12);
      
      const owner = new User({
        restaurantId: restaurant._id,
        name: data.ownerName,
        email: data.email.toLowerCase(),
        phone: data.phone,
        passwordHash,
        role: UserRole.OWNER,
        status: UserStatus.ACTIVE,
      });

      await owner.save({ session });

      // Link owner to restaurant
      restaurant.ownerId = owner._id;
      await restaurant.save({ session });

      // Initialize defaults here (categories, settings) if needed later
      
      await session.commitTransaction();
      
      return { restaurant, ownerId: owner._id };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async switchBranch(userId: string, currentRestaurantId: string, targetBranchId: string) {
    const currentRes = await Restaurant.findById(currentRestaurantId);
    if (!currentRes) {
      throw new Error('Current restaurant context not found');
    }

    const rootId = currentRes.parentRestaurantId || currentRes._id;

    // Check if target is authorized (either the root itself, or a branch of the root)
    const targetRes = await Restaurant.findById(targetBranchId);
    if (!targetRes) {
      throw new Error('Target branch not found');
    }

    const isAuthorized = targetRes._id.toString() === rootId.toString() || 
      (targetRes.parentRestaurantId && targetRes.parentRestaurantId.toString() === rootId.toString());

    if (!isAuthorized) {
      throw new Error('Unauthorized to switch to this branch');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const payload = {
      userId: user._id.toString(),
      restaurantId: targetBranchId,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRES_IN as any });
    const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN as any });

    const { passwordHash, ...userWithoutPassword } = user.toObject();

    return {
      user: { ...userWithoutPassword, restaurant: targetRes.toObject() },
      accessToken,
      refreshToken,
    };
  }
}
