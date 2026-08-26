import mongoose, { Document, Schema, Types } from 'mongoose';

export enum RestaurantStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  INACTIVE = 'INACTIVE'
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  PENDING = 'PENDING'
}

export interface IRestaurant extends Document {
  name: string;
  ownerId?: Types.ObjectId; // References the main OWNER user
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstNumber?: string;
  restaurantType: string;
  logo?: string;
  openingTime?: string;
  closingTime?: string;
  status: RestaurantStatus;
  currency: string;
  timezone: string;
  isOnlineOrderingEnabled: boolean;
  onlineSlug?: string;
  isWaiterOrderingEnabled: boolean;
  waiterSlug?: string;
  isBillingEnabled: boolean;
  billingSlug?: string;
  isKdsEnabled: boolean;
  kdsSlug?: string;
  subscriptionStatus: SubscriptionStatus;
  subscriptionExpiresAt?: Date;
  parentRestaurantId?: Types.ObjectId;
  inventoryCheckFrequency: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
  inventoryCheckSnoozedUntil?: Date;
  notificationSettings?: {
    whatsappNumber: string;
    scheduledTime: string;
    enabled: boolean;
  };
  tableCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const RestaurantSchema = new Schema<IRestaurant>(
  {
    name: { type: String, required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User' },
    phone: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    gstNumber: { type: String },
    restaurantType: { type: String, required: true },
    logo: { type: String },
    openingTime: { type: String },
    closingTime: { type: String },
    status: { type: String, enum: Object.values(RestaurantStatus), default: RestaurantStatus.ACTIVE },
    currency: { type: String, default: 'INR' },
    timezone: { type: String, default: 'Asia/Kolkata' },
    isOnlineOrderingEnabled: { type: Boolean, default: false },
    onlineSlug: { type: String, lowercase: true, trim: true },
    isWaiterOrderingEnabled: { type: Boolean, default: false },
    waiterSlug: { type: String, lowercase: true, trim: true },
    isBillingEnabled: { type: Boolean, default: false },
    billingSlug: { type: String, lowercase: true, trim: true },
    isKdsEnabled: { type: Boolean, default: false },
    kdsSlug: { type: String, lowercase: true, trim: true },
    subscriptionStatus: { type: String, enum: Object.values(SubscriptionStatus), default: SubscriptionStatus.PENDING },
    subscriptionExpiresAt: { type: Date },
    parentRestaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant' },
    inventoryCheckFrequency: { type: String, enum: ['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY'], default: 'WEEKLY' },
    inventoryCheckSnoozedUntil: { type: Date },
    notificationSettings: {
      whatsappNumber: { type: String },
      scheduledTime: { type: String },
      enabled: { type: Boolean, default: false }
    },
    tableCount: { type: Number, default: 0, min: 0 }
  },
  { timestamps: true }
);

RestaurantSchema.index({ onlineSlug: 1 }, { unique: true, sparse: true });
RestaurantSchema.index({ waiterSlug: 1 }, { unique: true, sparse: true });
RestaurantSchema.index({ billingSlug: 1 }, { unique: true, sparse: true });
RestaurantSchema.index({ kdsSlug: 1 }, { unique: true, sparse: true });
RestaurantSchema.index({ parentRestaurantId: 1 });

export const Restaurant = mongoose.model<IRestaurant>('Restaurant', RestaurantSchema);
