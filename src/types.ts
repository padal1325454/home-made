export type Role = 'Admin' | 'Supervisor' | 'Employee';
export type ProductCategory = 'Homemade' | 'Groceries' | 'Raw Meat';
export type PricingType = 'FIXED' | 'PER_LB';
export type OrderStatus =
  | 'Draft'
  | 'Accepted'
  | 'Processing'
  | 'Prepared'
  | 'Delivered'
  | 'Awaiting Payment'
  | 'Paid'
  | 'Closed'
  | 'Cancelled';
export type PaymentStatus = 'Awaiting Payment' | 'Paid' | null;
export type PaymentMethod = 'COD' | 'Card';

export interface User {
  id: string;
  name: string;
  username: string;
  password: string;
  role: Role;
  active: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  dateOfBirth?: string;
  notes?: string;
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  pricingType: PricingType;
  price: number;
  active: boolean;
  description?: string;
  image?: string;
  stockQuantity?: number;
  lowStockThreshold?: number;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  pricingType: PricingType;
  unitPrice: number;
  quantity?: number;
  weightLbs?: number;
  lineTotal: number;
}

export interface TimelineEvent {
  id: string;
  action: string;
  by: string;
  at: string;
  data?: Record<string, string>;
}

export interface MessageLog {
  id: string;
  orderId: string;
  type: 'Invoice' | 'Receipt' | 'Status Update';
  channel: 'Email' | 'SMS';
  status: 'Sent' | 'Failed' | 'Skipped';
  by: string;
  at: string;
  details?: string;
}

export interface Order {
  id: string;
  orderNumber: string | null;
  invoiceNumber: string | null;
  customerId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  fees: number;
  total: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  cancelReason?: string;
  timeline: TimelineEvent[];
}

export interface Settings {
  businessName: string;
  taxEnabled: boolean;
  taxPercent: number;
  feesEnabled: boolean;
  feeValue: number;
  templates: {
    invoiceEmail: string;
    invoiceSms: string;
    receiptEmail: string;
    receiptSms: string;
    statusProcessing: string;
    statusPrepared: string;
    statusDelivered: string;
  };
}

export interface Toast {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'info';
}
