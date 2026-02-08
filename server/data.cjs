const seed = () => ({
  users: [
    { id: 'u1', name: 'Admin User', username: 'admin', password: 'admin123', role: 'Admin', active: true },
    { id: 'u2', name: 'Supervisor One', username: 'supervisor', password: 'super123', role: 'Supervisor', active: true },
    { id: 'u3', name: 'John Employee', username: 'employee', password: 'emp123', role: 'Employee', active: true },
    { id: 'u4', name: 'Admin Demo', username: 'admin@demo.com', password: 'admin123', role: 'Admin', active: true },
    { id: 'u5', name: 'Supervisor Demo', username: 'supervisor@demo.com', password: 'super123', role: 'Supervisor', active: true },
    { id: 'u6', name: 'Employee Demo', username: 'employee@demo.com', password: 'emp123', role: 'Employee', active: true },
  ],
  customers: [
    {
      id: 'c1',
      name: 'John Smith',
      phone: '555-0101',
      email: 'john@example.com',
      address: '123 Main St, Dallas, TX 75201',
      dateOfBirth: '1989-05-12',
    },
    {
      id: 'c2',
      name: 'Sarah Johnson',
      phone: '555-0102',
      email: 'sarah@example.com',
      address: '88 West Dr, Plano, TX 75074',
      dateOfBirth: '1993-11-02',
    },
    {
      id: 'c3',
      name: 'Mike Chen',
      phone: '555-0103',
      email: '',
      address: '19 Lakeview Ave, Frisco, TX 75033',
      dateOfBirth: '1990-03-25',
    },
  ],
  products: [
    {
      id: 'p1',
      name: 'Chicken Biryani',
      category: 'Homemade',
      pricingType: 'FIXED',
      price: 12.99,
      active: true,
      stockQuantity: 18,
      lowStockThreshold: 8,
    },
    {
      id: 'p2',
      name: 'Samosa (6 pcs)',
      category: 'Homemade',
      pricingType: 'FIXED',
      price: 5.99,
      active: true,
      stockQuantity: 6,
      lowStockThreshold: 10,
    },
    {
      id: 'p3',
      name: 'Organic Rice',
      category: 'Groceries',
      pricingType: 'FIXED',
      price: 8.49,
      active: true,
      stockQuantity: 24,
      lowStockThreshold: 6,
    },
    {
      id: 'p4',
      name: 'Olive Oil',
      category: 'Groceries',
      pricingType: 'FIXED',
      price: 14.99,
      active: true,
      stockQuantity: 4,
      lowStockThreshold: 6,
    },
    {
      id: 'p5',
      name: 'Chicken Breast',
      category: 'Raw Meat',
      pricingType: 'PER_LB',
      price: 4.99,
      active: true,
      stockQuantity: 14,
      lowStockThreshold: 10,
    },
    {
      id: 'p6',
      name: 'Ground Beef',
      category: 'Raw Meat',
      pricingType: 'PER_LB',
      price: 6.49,
      active: true,
      stockQuantity: 3,
      lowStockThreshold: 8,
    },
  ],
  orders: [],
  messages: [],
  settings: {
    businessName: 'Home Made Foods',
    taxEnabled: false,
    taxPercent: 8.5,
    feesEnabled: false,
    feeValue: 2.5,
    templates: {
      invoiceEmail: 'Order {{orderId}}, Invoice {{invoiceId}}. Items: {{items}}. Total: {{total}}. Thank you!',
      invoiceSms: 'Order {{orderId}}, Invoice {{invoiceId}}. Total: {{total}}. Thank you!',
      receiptEmail: 'Payment received. Amount: {{amount}}, Method: {{method}}. Invoice {{invoiceId}}.',
      receiptSms: 'Payment received. Amount: {{amount}}. Invoice {{invoiceId}}.',
      statusProcessing: 'Your order is Processing.',
      statusPrepared: 'Your order is Prepared.',
      statusDelivered: 'Your order has been Delivered.',
    },
  },
  counters: {
    order: 1000,
    invoice: 1000,
  },
});

let data = seed();

const reset = () => {
  data = seed();
};

const getAll = (key) => data[key];
const setAll = (key, value) => {
  data[key] = value;
};

const createItem = (key, item) => {
  data[key].push(item);
  return item;
};

const updateItem = (key, id, patch) => {
  const idx = data[key].findIndex((item) => item.id === id);
  if (idx === -1) return null;
  data[key][idx] = { ...data[key][idx], ...patch };
  return data[key][idx];
};

const nextOrderNumber = () => {
  const value = `ORD-${data.counters.order}`;
  data.counters.order += 1;
  return value;
};

const nextInvoiceNumber = () => {
  const value = `INV-${data.counters.invoice}`;
  data.counters.invoice += 1;
  return value;
};

module.exports = {
  reset,
  getAll,
  setAll,
  createItem,
  updateItem,
  nextOrderNumber,
  nextInvoiceNumber,
};
