import mongoose, { Document, Schema, Types } from 'mongoose';

export enum OrderStatus {
  DRAFT = 'DRAFT',
  PLACED = 'PLACED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum PaymentMethod {
  CASH = 'CASH',
  UPI = 'UPI',
  CARD = 'CARD',
  OTHER = 'OTHER'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  REFUNDED = 'REFUNDED'
}

export enum OrderSource {
  IN_STORE = 'IN_STORE',
  ONLINE = 'ONLINE'
}

export interface IOrderItem {
  dishId: Types.ObjectId;
  dishName: string; // Snapshot
  quantity: number;
  unitPrice: number; // Snapshot
  taxRate: number; // Snapshot
  lineTotal: number; // Snapshot
  addedBy?: Types.ObjectId; // User who added this item
}

export interface IOrder extends Document {
  restaurantId: Types.ObjectId;
  orderNumber: string;
  customerId?: Types.ObjectId;
  items: IOrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod?: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  orderSource: OrderSource;
  customerInfo?: {
    name: string;
    phone: string;
    address: string;
  };
  tableId?: Types.ObjectId;
  inventoryConsumed: boolean;
  startedBy?: Types.ObjectId; // The user who opened the order initially
  createdBy?: Types.ObjectId;
  orderActivity: {
    action: string;
    userId: Types.ObjectId;
    timestamp: Date;
    details?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>({
  dishId: { type: Schema.Types.ObjectId, ref: 'Dish', required: true },
  dishName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  taxRate: { type: Number, required: true, min: 0 },
  lineTotal: { type: Number, required: true, min: 0 },
  addedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { _id: false });

const OrderActivitySchema = new Schema({
  action: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  timestamp: { type: Date, default: Date.now },
  details: { type: String }
}, { _id: false });

const OrderSchema = new Schema<IOrder>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    orderNumber: { type: String, required: true },
    customerId: { type: Schema.Types.ObjectId },
    items: [OrderItemSchema],
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    tax: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: Object.values(PaymentMethod) },
    paymentStatus: { type: String, enum: Object.values(PaymentStatus), default: PaymentStatus.PENDING },
    orderStatus: { type: String, enum: Object.values(OrderStatus), default: OrderStatus.PLACED },
    orderSource: { type: String, enum: Object.values(OrderSource), default: OrderSource.IN_STORE },
    customerInfo: {
      name: { type: String },
      phone: { type: String },
      address: { type: String }
    },
    tableId: { type: Schema.Types.ObjectId, ref: 'Table' },
    inventoryConsumed: { type: Boolean, default: false },
    startedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    orderActivity: [OrderActivitySchema],
  },
  { timestamps: true }
);

OrderSchema.index({ restaurantId: 1, orderNumber: 1 }, { unique: true });
OrderSchema.index({ restaurantId: 1, createdAt: -1 });

export const Order = mongoose.model<IOrder>('Order', OrderSchema);
