/**
 * Data layer - localStorage persistence for Order Management System
 */

const STORAGE_KEYS = {
  users: 'oms_users',
  customers: 'oms_customers',
  products: 'oms_products',
  orders: 'oms_orders',
  messages: 'oms_messages',
  settings: 'oms_settings',
  orderCounter: 'oms_order_counter',
  invoiceCounter: 'oms_invoice_counter',
};

const PRODUCT_CATEGORIES = ['Homemade', 'Groceries', 'Raw Meat'];
const PRICING_TYPES = { FIXED: 'FIXED', PER_LB: 'PER_LB' };
const ORDER_STATUSES = ['Draft', 'Accepted', 'Processing', 'Prepared', 'Delivered', 'Awaiting Payment', 'Paid', 'Closed', 'Cancelled'];
const PAYMENT_STATUSES = ['Awaiting Payment', 'Paid'];
const PAYMENT_METHODS = ['COD', 'Card'];

function get(key, defaultValue = []) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function set(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Users
function getUsers() {
  return get(STORAGE_KEYS.users);
}

function saveUsers(users) {
  set(STORAGE_KEYS.users, users);
}

function getCurrentUser() {
  return JSON.parse(sessionStorage.getItem('oms_current_user') || 'null');
}

function setCurrentUser(user) {
  sessionStorage.setItem('oms_current_user', user ? JSON.stringify(user) : '');
}

// Customers
function getCustomers() {
  return get(STORAGE_KEYS.customers);
}

function saveCustomers(customers) {
  set(STORAGE_KEYS.customers, customers);
}

function findCustomerByPhoneOrName(search) {
  const customers = getCustomers();
  const s = (search || '').toLowerCase().trim();
  if (!s) return [];
  return customers.filter(c => 
    (c.phone || '').includes(s) || 
    (c.name || '').toLowerCase().includes(s) ||
    (c.email || '').toLowerCase().includes(s)
  );
}

// Products
function getProducts() {
  return get(STORAGE_KEYS.products);
}

function saveProducts(products) {
  set(STORAGE_KEYS.products, products);
}

function getProductsByCategory(category) {
  const products = getProducts();
  if (!category) return products;
  return products.filter(p => p.category === category);
}

// Orders
function getOrders() {
  return get(STORAGE_KEYS.orders);
}

function saveOrders(orders) {
  set(STORAGE_KEYS.orders, orders);
}

function getNextOrderNumber() {
  const n = parseInt(localStorage.getItem(STORAGE_KEYS.orderCounter) || '1000', 10);
  localStorage.setItem(STORAGE_KEYS.orderCounter, String(n + 1));
  return `ORD-${n}`;
}

function getNextInvoiceNumber() {
  const n = parseInt(localStorage.getItem(STORAGE_KEYS.invoiceCounter) || '1000', 10);
  localStorage.setItem(STORAGE_KEYS.invoiceCounter, String(n + 1));
  return `INV-${n}`;
}

// Messages / Audit
function getMessages() {
  return get(STORAGE_KEYS.messages);
}

function saveMessages(messages) {
  set(STORAGE_KEYS.messages, messages);
}

function addMessage(msg) {
  const messages = getMessages();
  messages.push({ ...msg, id: Date.now().toString(), timestamp: new Date().toISOString() });
  saveMessages(messages);
}

// Settings
function getSettings() {
  const defaults = {
    businessName: 'My Business',
    taxEnabled: false,
    taxPercent: 0,
    feesEnabled: false,
    feeValue: 0,
    templates: {
      invoiceEmail: 'Order {{orderId}}, Invoice {{invoiceId}}. Items: {{items}}. Total: {{total}}. Thank you!',
      invoiceSms: 'Order {{orderId}}, Invoice {{invoiceId}}. Total: {{total}}. Thank you!',
      receiptEmail: 'Payment received. Amount: {{amount}}, Method: {{method}}. Invoice {{invoiceId}}.',
      receiptSms: 'Payment received. Amount: {{amount}}. Invoice {{invoiceId}}.',
      statusProcessing: 'Your order is Processing.',
      statusPrepared: 'Your order is Prepared.',
      statusDelivered: 'Your order has been Delivered.',
    },
  };
  const saved = get(STORAGE_KEYS.settings, null);
  return saved ? { ...defaults, ...saved } : defaults;
}

function saveSettings(settings) {
  set(STORAGE_KEYS.settings, settings);
}

// Seed initial data if empty
function seedData() {
  if (getUsers().length === 0) {
    saveUsers([
      { id: '1', name: 'Admin User', username: 'admin', password: 'admin123', role: 'Admin', active: true },
      { id: '2', name: 'Supervisor One', username: 'supervisor', password: 'super123', role: 'Supervisor', active: true },
      { id: '3', name: 'John Employee', username: 'employee', password: 'emp123', role: 'Employee', active: true },
    ]);
  }
  if (getCustomers().length === 0) {
    saveCustomers([
      { id: '1', name: 'John Smith', phone: '555-0101', email: 'john@example.com' },
      { id: '2', name: 'Sarah Johnson', phone: '555-0102', email: 'sarah@example.com' },
      { id: '3', name: 'Mike Chen', phone: '555-0103', email: '' },
    ]);
  }
  if (getProducts().length === 0) {
    saveProducts([
      { id: '1', name: 'Chicken Biryani', category: 'Homemade', pricingType: 'FIXED', price: 12.99, active: true },
      { id: '2', name: 'Samosa (6 pcs)', category: 'Homemade', pricingType: 'FIXED', price: 5.99, active: true },
      { id: '3', name: 'Organic Rice', category: 'Groceries', pricingType: 'FIXED', price: 8.49, active: true },
      { id: '4', name: 'Olive Oil', category: 'Groceries', pricingType: 'FIXED', price: 14.99, active: true },
      { id: '5', name: 'Chicken Breast', category: 'Raw Meat', pricingType: 'PER_LB', price: 4.99, active: true },
      { id: '6', name: 'Ground Beef', category: 'Raw Meat', pricingType: 'PER_LB', price: 6.49, active: true },
    ]);
  }
}
