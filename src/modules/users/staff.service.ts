import { User, UserRole, UserStatus } from './user.model';
import bcrypt from 'bcryptjs';
import { ValidationError } from '../../shared/errors/AppError';

export class StaffService {
  static async createStaff(restaurantId: string, data: any) {
    // Check if loginId is already taken for this restaurant
    if (data.loginId) {
      const existing = await User.findOne({ restaurantId, loginId: data.loginId });
      if (existing) {
        throw new ValidationError('Login ID is already taken for this restaurant');
      }
    }

    // Check if email is provided and already taken
    if (data.email) {
      const existing = await User.findOne({ email: data.email.toLowerCase() });
      if (existing) {
        throw new ValidationError('Email is already registered');
      }
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const newStaff = new User({
      restaurantId,
      name: data.name,
      email: data.email ? data.email.toLowerCase() : undefined,
      loginId: data.loginId,
      phone: data.phone,
      passwordHash,
      role: data.role as UserRole,
      status: UserStatus.ACTIVE
    });

    await newStaff.save();
    
    const { passwordHash: _, ...staffWithoutPassword } = newStaff.toObject();
    return staffWithoutPassword;
  }

  static async getStaff(restaurantId: string) {
    const staff = await User.find({ restaurantId }).select('-passwordHash').sort({ createdAt: -1 });
    return staff;
  }

  static async updateStaff(restaurantId: string, staffId: string, data: any) {
    const staff = await User.findOne({ _id: staffId, restaurantId });
    if (!staff) {
      throw new ValidationError('Staff member not found');
    }

    if (data.name) staff.name = data.name;
    if (data.phone) staff.phone = data.phone;
    if (data.role) staff.role = data.role as UserRole;
    if (data.status) staff.status = data.status as UserStatus;

    // We do not update loginId or email here to keep it simple, but we could if needed.

    await staff.save();
    const { passwordHash: _, ...staffWithoutPassword } = staff.toObject();
    return staffWithoutPassword;
  }

  static async resetPin(restaurantId: string, staffId: string, newPin: string) {
    const staff = await User.findOne({ _id: staffId, restaurantId });
    if (!staff) {
      throw new ValidationError('Staff member not found');
    }

    const passwordHash = await bcrypt.hash(newPin, 12);
    staff.passwordHash = passwordHash;
    await staff.save();
    
    return { success: true, message: 'PIN reset successfully' };
  }
}
