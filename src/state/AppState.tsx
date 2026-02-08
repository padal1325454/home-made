import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  Customer,
  MessageLog,
  Order,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  Product,
  Role,
  Settings,
  Toast,
  User,
} from '../types';
import { seedCustomers, seedMessages, seedOrders, seedProducts, seedSettings, seedUsers } from '../mock/seed';
import { api } from '../api/client';

interface AppContextValue {
  currentUser: User | null;
  users: User[];
  customers: Customer[];
  products: Product[];
  orders: Order[];
  messages: MessageLog[];
  settings: Settings;
  toasts: Toast[];
  login: (username: string, password: string) => boolean;
  logout: () => void;
  addToast: (message: string, type?: Toast['type']) => void;
  updateSettings: (settings: Settings) => void;
  upsertUser: (user: User) => void;
  upsertCustomer: (customer: Customer) => void;
  upsertProduct: (product: Product) => void;
  createDraftOrder: (payload: {
    customerId: string;
    items: OrderItem[];
    createdById: string;
    createdByName: string;
  }) => Order;
  acceptOrder: (payload: {
    orderId?: string;
    customerId: string;
    items: OrderItem[];
    sendEmail: boolean;
    sendSms: boolean;
    createdById: string;
    createdByName: string;
  }) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus, by: string) => void;
  recordPayment: (payload: {
    orderId: string;
    method: PaymentMethod;
    amount: number;
    sendReceipt: boolean;
    by: string;
  }) => void;
  closeOrder: (orderId: string, by: string, notes?: string) => void;
  cancelOrder: (orderId: string, by: string, reason: string) => void;
  resendInvoice: (orderId: string, by: string, sendEmail: boolean, sendSms: boolean) => void;
  sendStatusUpdate: (orderId: string, by: string, channel: 'Email' | 'SMS', message: string) => void;
  getRoleAccess: (role: Role, page: string) => boolean;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

const nowIso = () => new Date().toISOString();
const id = () => Math.random().toString(36).slice(2, 10);

const calcLineTotal = (item: OrderItem) => {
  if (item.pricingType === 'PER_LB') {
    return (item.weightLbs || 0) * item.unitPrice;
  }
  return (item.quantity || 0) * item.unitPrice;
};

const calcTotals = (items: OrderItem[], settings: Settings) => {
  const subtotal = items.reduce((sum, item) => sum + calcLineTotal(item), 0);
  const tax = settings.taxEnabled ? (subtotal * settings.taxPercent) / 100 : 0;
  const fees = settings.feesEnabled ? settings.feeValue : 0;
  const total = subtotal + tax + fees;
  return { subtotal, tax, fees, total };
};

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(seedUsers);
  const [customers, setCustomers] = useState<Customer[]>(seedCustomers);
  const [products, setProducts] = useState<Product[]>(seedProducts);
  const [orders, setOrders] = useState<Order[]>(seedOrders);
  const [messages, setMessages] = useState<MessageLog[]>(seedMessages);
  const [settings, setSettings] = useState<Settings>(seedSettings);
  const [orderCounter, setOrderCounter] = useState(1000);
  const [invoiceCounter, setInvoiceCounter] = useState(1000);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [loading, setLoading] = useState(false);

  const addToast = (message: string, type: Toast['type'] = 'success') => {
    const toast: Toast = { id: id(), message, type };
    setToasts(prev => [...prev, toast]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toast.id));
    }, 3000);
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const [usersRes, customersRes, productsRes, ordersRes, messagesRes, settingsRes] = await Promise.all([
          api.getUsers(),
          api.getCustomers(),
          api.getProducts(),
          api.getOrders(),
          api.getMessages(),
          api.getSettings(),
        ]);
        if (!active) return;
        setUsers(usersRes);
        setCustomers(customersRes);
        setProducts(productsRes);
        setOrders(ordersRes);
        setMessages(messagesRes);
        setSettings(settingsRes);
      } catch (error) {
        addToast('API not reachable, using local data', 'info');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const login = (username: string, password: string) => {
    const user = users.find(u => u.username === username && u.password === password && u.active);
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.setItem('admin_auto_login_disabled', 'true');
  };

  const updateSettings = (next: Settings) => {
    setSettings(next);
    api.updateSettings(next).catch(() => null);
  };

  const upsertUser = (user: User) => {
    setUsers(prev => {
      const idx = prev.findIndex(u => u.id === user.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = user;
        api.updateUser(user.id, user).catch(() => null);
        return copy;
      }
      api.createUser(user).catch(() => null);
      return [...prev, user];
    });
  };

  const upsertCustomer = (customer: Customer) => {
    setCustomers(prev => {
      const idx = prev.findIndex(c => c.id === customer.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = customer;
        api.updateCustomer(customer.id, customer).catch(() => null);
        return copy;
      }
      api.createCustomer(customer).catch(() => null);
      return [...prev, customer];
    });
  };

  const upsertProduct = (product: Product) => {
    setProducts(prev => {
      const idx = prev.findIndex(p => p.id === product.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = product;
        api.updateProduct(product.id, product).catch(() => null);
        return copy;
      }
      api.createProduct(product).catch(() => null);
      return [...prev, product];
    });
  };

  const createDraftOrder = (payload: { customerId: string; items: OrderItem[]; createdById: string; createdByName: string }) => {
    const totals = calcTotals(payload.items, settings);
    const order: Order = {
      id: id(),
      orderNumber: null,
      invoiceNumber: null,
      customerId: payload.customerId,
      status: 'Draft',
      paymentStatus: null,
      items: payload.items.map(item => ({ ...item, lineTotal: calcLineTotal(item) })),
      subtotal: totals.subtotal,
      tax: totals.tax,
      fees: totals.fees,
      total: totals.total,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      createdBy: payload.createdById,
      timeline: [
        {
          id: id(),
          action: 'Created Draft',
          by: payload.createdByName,
          at: nowIso(),
        },
      ],
    };
    setOrders(prev => [...prev, order]);
    api.createOrder(order).catch(() => null);
    return order;
  };

  const acceptOrder = (payload: {
    orderId?: string;
    customerId: string;
    items: OrderItem[];
    sendEmail: boolean;
    sendSms: boolean;
    createdById: string;
    createdByName: string;
  }) => {
    const orderNumber = `ORD-${orderCounter}`;
    const invoiceNumber = `INV-${invoiceCounter}`;
    setOrderCounter(prev => prev + 1);
    setInvoiceCounter(prev => prev + 1);
    const totals = calcTotals(payload.items, settings);
    const now = nowIso();
    let order: Order;

    if (payload.orderId) {
      const existing = orders.find(o => o.id === payload.orderId);
      if (!existing) {
        throw new Error('Order not found');
      }
      order = {
        ...existing,
        orderNumber,
        invoiceNumber,
        status: 'Accepted',
        paymentStatus: 'Awaiting Payment',
        items: payload.items.map(item => ({ ...item, lineTotal: calcLineTotal(item) })),
        subtotal: totals.subtotal,
        tax: totals.tax,
        fees: totals.fees,
        total: totals.total,
        updatedAt: now,
        timeline: [
          ...existing.timeline,
          {
            id: id(),
            action: 'Accepted',
            by: payload.createdByName,
            at: now,
            data: {
              email: payload.sendEmail ? 'Sent' : 'Skipped',
              sms: payload.sendSms ? 'Sent' : 'Skipped',
            },
          },
        ],
      };
      setOrders(prev => prev.map(o => (o.id === order.id ? order : o)));
      api.updateOrder(order.id, order).catch(() => null);
    } else {
      order = {
        id: id(),
        orderNumber,
        invoiceNumber,
        customerId: payload.customerId,
        status: 'Accepted',
        paymentStatus: 'Awaiting Payment',
        items: payload.items.map(item => ({ ...item, lineTotal: calcLineTotal(item) })),
        subtotal: totals.subtotal,
        tax: totals.tax,
        fees: totals.fees,
        total: totals.total,
        createdAt: now,
        updatedAt: now,
        createdBy: payload.createdById,
        timeline: [
          {
            id: id(),
            action: 'Accepted',
            by: payload.createdByName,
            at: now,
            data: {
              email: payload.sendEmail ? 'Sent' : 'Skipped',
              sms: payload.sendSms ? 'Sent' : 'Skipped',
            },
          },
        ],
      };
      setOrders(prev => [...prev, order]);
      api.createOrder(order).catch(() => null);
    }

    const logs: MessageLog[] = [
      {
        id: id(),
        orderId: order.id,
        type: 'Invoice',
        channel: 'Email',
        status: payload.sendEmail ? 'Sent' : 'Skipped',
        by: payload.createdByName,
        at: now,
      },
      {
        id: id(),
        orderId: order.id,
        type: 'Invoice',
        channel: 'SMS',
        status: payload.sendSms ? 'Sent' : 'Skipped',
        by: payload.createdByName,
        at: now,
      },
    ];
    setMessages(prev => [...prev, ...logs]);
    logs.forEach(log => api.createMessage(log).catch(() => null));
    return order;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus, by: string) => {
    setOrders(prev =>
      prev.map(order => {
        if (order.id !== orderId) return order;
        const now = nowIso();
        let nextStatus: OrderStatus = status;
        let timeline = [...order.timeline, { id: id(), action: status, by, at: now }];
        let paymentStatus =
          nextStatus === 'Awaiting Payment' ? 'Awaiting Payment' : order.paymentStatus;
        if (status === 'Delivered') {
          nextStatus = 'Awaiting Payment';
          paymentStatus = 'Awaiting Payment';
          timeline = [
            ...order.timeline,
            { id: id(), action: 'Delivered', by, at: now },
            { id: id(), action: 'Awaiting Payment', by, at: now },
          ];
        }
        const updated = {
          ...order,
          status: nextStatus,
          paymentStatus,
          updatedAt: now,
          timeline,
        };
        api.updateOrder(orderId, updated).catch(() => null);
        return updated;
      })
    );
  };

  const recordPayment = (payload: {
    orderId: string;
    method: PaymentMethod;
    amount: number;
    sendReceipt: boolean;
    by: string;
  }) => {
    setOrders(prev =>
      prev.map(order => {
        if (order.id !== payload.orderId) return order;
        const now = nowIso();
        const updated = {
          ...order,
          status: 'Paid',
          paymentStatus: 'Paid',
          paymentMethod: payload.method,
          updatedAt: now,
          timeline: [
            ...order.timeline,
            {
              id: id(),
              action: 'Payment Recorded',
              by: payload.by,
              at: now,
              data: { method: payload.method, amount: payload.amount.toFixed(2) },
            },
          ],
        };
        api.updateOrder(order.id, updated).catch(() => null);
        return updated;
      })
    );

    if (payload.sendReceipt) {
      const now = nowIso();
      setMessages(prev => [
        ...prev,
        {
          id: id(),
          orderId: payload.orderId,
          type: 'Receipt',
          channel: 'Email',
          status: 'Sent',
          by: payload.by,
          at: now,
        },
        {
          id: id(),
          orderId: payload.orderId,
          type: 'Receipt',
          channel: 'SMS',
          status: 'Sent',
          by: payload.by,
          at: now,
        },
      ]);
      api.createMessage({
        id: id(),
        orderId: payload.orderId,
        type: 'Receipt',
        channel: 'Email',
        status: 'Sent',
        by: payload.by,
        at: now,
      }).catch(() => null);
      api.createMessage({
        id: id(),
        orderId: payload.orderId,
        type: 'Receipt',
        channel: 'SMS',
        status: 'Sent',
        by: payload.by,
        at: now,
      }).catch(() => null);
    }
  };

  const closeOrder = (orderId: string, by: string, notes?: string) => {
    setOrders(prev =>
      prev.map(order => {
        if (order.id !== orderId) return order;
        const now = nowIso();
        const updated = {
          ...order,
          status: 'Closed',
          updatedAt: now,
          timeline: [
            ...order.timeline,
            { id: id(), action: 'Closed', by, at: now, data: notes ? { notes } : undefined },
          ],
        };
        api.updateOrder(order.id, updated).catch(() => null);
        return updated;
      })
    );
  };

  const cancelOrder = (orderId: string, by: string, reason: string) => {
    setOrders(prev =>
      prev.map(order => {
        if (order.id !== orderId) return order;
        const now = nowIso();
        const updated = {
          ...order,
          status: 'Cancelled',
          cancelReason: reason,
          updatedAt: now,
          timeline: [
            ...order.timeline,
            { id: id(), action: 'Cancelled', by, at: now, data: { reason } },
          ],
        };
        api.updateOrder(order.id, updated).catch(() => null);
        return updated;
      })
    );
  };

  const resendInvoice = (orderId: string, by: string, sendEmail: boolean, sendSms: boolean) => {
    const now = nowIso();
    setMessages(prev => [
      ...prev,
      {
        id: id(),
        orderId,
        type: 'Invoice',
        channel: 'Email',
        status: sendEmail ? 'Sent' : 'Skipped',
        by,
        at: now,
      },
      {
        id: id(),
        orderId,
        type: 'Invoice',
        channel: 'SMS',
        status: sendSms ? 'Sent' : 'Skipped',
        by,
        at: now,
      },
    ]);
    api.createMessage({
      id: id(),
      orderId,
      type: 'Invoice',
      channel: 'Email',
      status: sendEmail ? 'Sent' : 'Skipped',
      by,
      at: now,
    }).catch(() => null);
    api.createMessage({
      id: id(),
      orderId,
      type: 'Invoice',
      channel: 'SMS',
      status: sendSms ? 'Sent' : 'Skipped',
      by,
      at: now,
    }).catch(() => null);
  };

  const sendStatusUpdate = (orderId: string, by: string, channel: 'Email' | 'SMS', message: string) => {
    setMessages(prev => [
      ...prev,
      { id: id(), orderId, type: 'Status Update', channel, status: 'Sent', by, at: nowIso(), details: message },
    ]);
    api.createMessage({
      id: id(),
      orderId,
      type: 'Status Update',
      channel,
      status: 'Sent',
      by,
      at: nowIso(),
      details: message,
    }).catch(() => null);
  };

  const getRoleAccess = (role: Role, page: string) => {
    if (role === 'Admin') return true;
    if (role === 'Supervisor') {
      return ['dashboard', 'orders', 'customers', 'products', 'users', 'reports'].includes(page);
    }
    return ['dashboard', 'orders', 'customers', 'products'].includes(page);
  };

  const value = useMemo<AppContextValue>(
    () => ({
      currentUser,
      users,
      customers,
      products,
      orders,
      messages,
      settings,
      toasts,
      login,
      logout,
      addToast,
      updateSettings,
      upsertUser,
      upsertCustomer,
      upsertProduct,
      createDraftOrder,
      acceptOrder,
      updateOrderStatus,
      recordPayment,
      closeOrder,
      cancelOrder,
      resendInvoice,
      sendStatusUpdate,
      getRoleAccess,
    }),
    [
      currentUser,
      users,
      customers,
      products,
      orders,
      messages,
      settings,
      toasts,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
};
