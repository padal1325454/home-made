const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5050';

const request = async (path: string, options?: RequestInit) => {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
};

export const api = {
  getUsers: () => request('/users'),
  createUser: (payload: any) => request('/users', { method: 'POST', body: JSON.stringify(payload) }),
  updateUser: (id: string, payload: any) => request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),

  getCustomers: () => request('/customers'),
  createCustomer: (payload: any) => request('/customers', { method: 'POST', body: JSON.stringify(payload) }),
  updateCustomer: (id: string, payload: any) => request(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),

  getProducts: () => request('/products'),
  createProduct: (payload: any) => request('/products', { method: 'POST', body: JSON.stringify(payload) }),
  updateProduct: (id: string, payload: any) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),

  getOrders: () => request('/orders'),
  createOrder: (payload: any) => request('/orders', { method: 'POST', body: JSON.stringify(payload) }),
  updateOrder: (id: string, payload: any) => request(`/orders/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),

  getMessages: () => request('/messages'),
  createMessage: (payload: any) => request('/messages', { method: 'POST', body: JSON.stringify(payload) }),

  getSettings: () => request('/settings'),
  updateSettings: (payload: any) => request('/settings', { method: 'PUT', body: JSON.stringify(payload) }),

  nextOrderNumber: () => request('/next/order-number'),
  nextInvoiceNumber: () => request('/next/invoice-number'),
};
