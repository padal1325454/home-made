/**
 * Order Management System - Full Application
 * Shopify-style phone order business dashboard
 */

// ============ STATE ============
let currentPage = 'dashboard';
let currentOrderId = null;
let currentCustomerId = null;

// ============ UTILS ============
function $(sel, el = document) { return el.querySelector(sel); }
function $$(sel, el = document) { return el.querySelectorAll(sel); }

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function formatDate(d) {
  if (!d) return '-';
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(d) {
  if (!d) return '-';
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ============ AUTH ============
function checkAuth() {
  const user = getCurrentUser();
  if (!user) {
    showPage('login');
    return false;
  }
  return true;
}

function login(username, password) {
  const users = getUsers();
  const user = users.find(u => u.username === username && u.password === password && u.active);
  if (user) {
    setCurrentUser({ id: user.id, name: user.name, username: user.username, role: user.role });
    showPage('dashboard');
    showToast(`Welcome, ${user.name}`);
    return true;
  }
  return false;
}

function logout() {
  setCurrentUser(null);
  showPage('login');
}

function canAccess(route) {
  const user = getCurrentUser();
  if (!user) return false;
  const role = user.role;
  if (route === 'users' && (role === 'Admin' || role === 'Supervisor')) return true;
  if (route === 'reports' && (role === 'Admin' || role === 'Supervisor')) return true;
  if (route === 'settings' && role === 'Admin') return true;
  return ['dashboard', 'orders', 'customers', 'products'].includes(route);
}

// ============ ROUTING ============
function showPage(page, id = null) {
  currentPage = page;
  currentOrderId = id;
  if (page === 'customer-profile') currentCustomerId = id;

  // Hide all pages
  $$('.page').forEach(p => p.classList.add('hidden'));
  $$('.nav-item').forEach(n => n.classList.remove('active'));

  // Show login or app
  const loginEl = $('.login-page');
  const appEl = $('.app-container');
  if (page === 'login') {
    loginEl.classList.remove('hidden');
    appEl.classList.add('hidden');
    return;
  }
  loginEl.classList.add('hidden');
  appEl.classList.remove('hidden');

  if (!checkAuth()) return;

  // Update nav
  const navMap = { dashboard: 'nav-dashboard', orders: 'nav-orders', customers: 'nav-customers', products: 'nav-products', users: 'nav-users', reports: 'nav-reports', settings: 'nav-settings' };
  const navId = navMap[page];
  if (navId) {
    const navEl = $('#' + navId);
    if (navEl) navEl.classList.add('active');
  }

  // Show target page
  const pageIds = {
    dashboard: 'page-dashboard',
    'orders-list': 'page-orders',
    'order-draft': 'page-order-draft',
    'order-details': 'page-order-details',
    'customers-list': 'page-customers',
    'customer-form': 'page-customer-form',
    'customer-profile': 'page-customer-profile',
    'products-list': 'page-products',
    'users-list': 'page-users',
    'reports': 'page-reports',
    'settings': 'page-settings',
  };
  const targetId = pageIds[page] || pageIds[page.split('-')[0] + '-list'] || 'page-dashboard';
  const targetEl = $('#' + targetId);
  if (targetEl) targetEl.classList.remove('hidden');

  // Render page content
  if (page === 'dashboard') renderDashboard();
  else if (page === 'orders-list') renderOrdersList();
  else if (page === 'order-draft') renderOrderDraft();
  else if (page === 'order-details' && id) renderOrderDetails(id);
  else if (page === 'customers-list') renderCustomersList();
  else if (page === 'customer-form') renderCustomerForm(id);
  else if (page === 'customer-profile' && id) renderCustomerProfile(id);
  else if (page === 'products-list') renderProductsList();
  else if (page === 'users-list') renderUsersList();
  else if (page === 'reports') renderReports();
  else if (page === 'settings') renderSettings();

  updateTopBar(page);
}

function updateTopBar(page) {
  const titleEl = $('.top-bar-title');
  const createBtn = $('.top-bar-create-order');
  if (titleEl) {
    const titles = { dashboard: 'Dashboard', 'orders-list': 'Orders', 'order-draft': 'Create Order', 'order-details': 'Order Details', 'customers-list': 'Customers', 'customer-form': 'Add Customer', 'customer-profile': 'Customer Profile', 'products-list': 'Products', 'users-list': 'Users', 'reports': 'Reports', 'settings': 'Settings' };
    titleEl.textContent = titles[page] || 'Dashboard';
  }
  if (createBtn) createBtn.style.display = ['orders-list', 'dashboard', 'customers-list', 'customer-profile'].includes(page) ? 'inline-flex' : 'none';
}

// ============ DASHBOARD ============
function renderDashboard() {
  const user = getCurrentUser();
  const content = $('#page-dashboard .page-content-inner');
  if (!content) return;

  const isEmployee = user.role === 'Employee';
  const orders = getOrders();
  const stats = {
    totalOrders: orders.length,
    draft: orders.filter(o => o.status === 'Draft').length,
    active: orders.filter(o => ['Accepted', 'Processing', 'Prepared', 'Delivered'].includes(o.status)).length,
    awaitingPayment: orders.filter(o => o.status === 'Awaiting Payment').length,
    paid: orders.filter(o => o.status === 'Paid' || o.status === 'Closed').length,
    cancelled: orders.filter(o => o.status === 'Cancelled').length,
    revenue: orders.filter(o => o.paymentStatus === 'Paid').reduce((s, o) => s + (o.total || 0), 0),
  };

  content.innerHTML = `
    ${isEmployee ? `
    <div class="dashboard-search-card">
      <h3>Customer Search</h3>
      <p class="text-secondary">Enter phone or name to find a customer</p>
      <div class="customer-search-box">
        <input type="text" id="dashboard-customer-search" placeholder="Phone or name..." class="search-input">
        <button type="button" class="btn-primary" id="dashboard-search-btn">Search</button>
      </div>
      <div id="dashboard-search-results" class="search-results-box hidden"></div>
    </div>
    ` : ''}
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-label">Total Orders</div><div class="stat-value">${stats.totalOrders}</div></div>
      <div class="stat-card"><div class="stat-label">Active</div><div class="stat-value">${stats.active}</div></div>
      <div class="stat-card"><div class="stat-label">Awaiting Payment</div><div class="stat-value">${stats.awaitingPayment}</div></div>
      <div class="stat-card"><div class="stat-label">Revenue (Paid)</div><div class="stat-value">$${stats.revenue.toFixed(2)}</div></div>
    </div>
    <div class="card">
      <div class="card-header"><h2 class="card-title">Recent Orders</h2><a href="#" class="card-action" data-goto="orders-list">View all</a></div>
      <table class="table">
        <thead><tr><th>Order #</th><th>Customer</th><th>Status</th><th>Total</th><th>Actions</th></tr></thead>
        <tbody>
          ${orders.slice(-5).reverse().map(o => `
            <tr>
              <td>${o.orderNumber || '-'}</td>
              <td>${(getCustomers().find(c => c.id === o.customerId) || {}).name || '-'}</td>
              <td>${renderStatusBadge(o.status)}</td>
              <td>$${(o.total || 0).toFixed(2)}</td>
              <td><a href="#" class="link-btn" data-goto="order-details" data-id="${o.id}">View</a></td>
            </tr>
          `).join('') || '<tr><td colspan="5" class="empty-cell">No orders yet</td></tr>'}
        </tbody>
      </table>
    </div>
  `;

  if (isEmployee) {
    $('#dashboard-search-btn').addEventListener('click', () => handleCustomerSearch('dashboard'));
    $('#dashboard-customer-search').addEventListener('keydown', e => { if (e.key === 'Enter') handleCustomerSearch('dashboard'); });
  }
  bindDataLinks(content);
}

function handleCustomerSearch(source) {
  const inp = document.getElementById(source + '-customer-search');
  const search = (inp?.value || '').trim();
  const resultsEl = document.getElementById(source + '-search-results');
  if (!resultsEl) return;

  if (!search) {
    resultsEl.classList.add('hidden');
    return;
  }

  const matches = findCustomerByPhoneOrName(search);
  if (matches.length === 0) {
    resultsEl.classList.remove('hidden');
    resultsEl.innerHTML = `
      <div class="search-no-results">No customer found</div>
      <button type="button" class="btn-primary" data-goto="customer-form">Create New Customer</button>
    `;
  } else {
    resultsEl.classList.remove('hidden');
    resultsEl.innerHTML = `
      <div class="search-results-list">
        ${matches.map(c => `
          <div class="search-result-item" data-id="${c.id}" data-goto="customer-profile">
            <strong>${c.name}</strong> — ${c.phone || '-'} ${c.email ? `(${c.email})` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }
  bindDataLinks(resultsEl);
}

// ============ ORDERS ============
const ORDER_TABS = ['Draft', 'Active', 'Awaiting Payment', 'Closed', 'Cancelled'];

function renderOrdersList() {
  const content = $('#page-orders .page-content-inner');
  if (!content) return;

  const activeTab = sessionStorage.getItem('orders_tab') || 'Draft';
  const orders = getOrders();

  const filterByTab = (tab) => {
    if (tab === 'Draft') return orders.filter(o => o.status === 'Draft');
    if (tab === 'Active') return orders.filter(o => ['Accepted', 'Processing', 'Prepared', 'Delivered'].includes(o.status));
    if (tab === 'Awaiting Payment') return orders.filter(o => o.status === 'Awaiting Payment');
    if (tab === 'Closed') return orders.filter(o => o.status === 'Closed' || o.status === 'Paid');
    if (tab === 'Cancelled') return orders.filter(o => o.status === 'Cancelled');
    return orders;
  };

  const filtered = filterByTab(activeTab);

  content.innerHTML = `
    <div class="orders-tabs">
      ${ORDER_TABS.map(t => `
        <button class="tab-btn ${t === activeTab ? 'active' : ''}" data-tab="${t}">${t}</button>
      `).join('')}
    </div>
    <div class="table-toolbar">
      <input type="text" class="search-input" id="orders-search" placeholder="Search orders...">
      <select id="orders-status-filter"><option value="">All statuses</option>${ORDER_STATUSES.map(s => `<option value="${s}">${s}</option>`).join('')}</select>
    </div>
    <div class="card">
      <table class="table">
        <thead>
          <tr>
            <th>Order #</th><th>Invoice #</th><th>Customer</th><th>Order Status</th><th>Payment</th><th>Total</th><th>Created</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${filtered.map(o => {
            const cust = getCustomers().find(c => c.id === o.customerId);
            return `<tr>
              <td>${o.orderNumber || '-'}</td>
              <td>${o.invoiceNumber || '-'}</td>
              <td>${(cust || {}).name || '-'}</td>
              <td>${renderStatusBadge(o.status)}</td>
              <td>${o.status === 'Draft' ? '-' : renderPaymentBadge(o.paymentStatus)}</td>
              <td>$${(o.total || 0).toFixed(2)}</td>
              <td>${formatDate(o.createdAt)}</td>
              <td>
                <a href="#" class="link-btn" data-goto="order-details" data-id="${o.id}">View</a>
                ${o.invoiceNumber ? `<a href="#" class="link-btn" data-print-order="${o.id}">Print</a>` : ''}
              </td>
            </tr>`;
          }).join('') || '<tr><td colspan="8" class="empty-cell">No orders</td></tr>'}
        </tbody>
      </table>
    </div>
  `;

  $$('.tab-btn', content).forEach(btn => {
    btn.addEventListener('click', () => {
      sessionStorage.setItem('orders_tab', btn.dataset.tab);
      renderOrdersList();
    });
  });
  bindDataLinks(content);
}

function renderStatusBadge(status) {
  const cls = { Draft: 'badge-secondary', Accepted: 'badge-info', Processing: 'badge-info', Prepared: 'badge-info', Delivered: 'badge-success', 'Awaiting Payment': 'badge-warning', Paid: 'badge-success', Closed: 'badge-success', Cancelled: 'badge-critical' }[status] || 'badge-secondary';
  return `<span class="badge ${cls}">${status}</span>`;
}

function renderPaymentBadge(status) {
  const cls = status === 'Paid' ? 'badge-success' : 'badge-warning';
  return `<span class="badge ${cls}">${status || 'Awaiting Payment'}</span>`;
}

// ============ ORDER DRAFT ============
function renderOrderDraft() {
  const content = $('#page-order-draft .page-content-inner');
  if (!content) return;

  const products = getProducts();
  const categories = ['Homemade', 'Groceries', 'Raw Meat'];

  content.innerHTML = `
    <div class="draft-order-layout">
      <div class="draft-left">
        <div class="product-search-box">
          <input type="text" id="draft-product-search" placeholder="Search products..." class="search-input">
        </div>
        <div class="category-tabs">
          ${categories.map(c => `<button class="cat-tab-btn" data-cat="${c}">${c}</button>`).join('')}
        </div>
        <div class="product-grid" id="draft-product-grid">
          ${products.filter(p => p.active).map(p => `
            <div class="product-card" data-product='${JSON.stringify(p)}'>
              <div class="product-card-name">${p.name}</div>
              <div class="product-card-price">${p.pricingType === 'PER_LB' ? `$${p.price}/lb` : `$${p.price}`}</div>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="draft-right">
        <div class="customer-selector">
          <label>Customer</label>
          <div class="customer-search-inline">
            <input type="text" id="draft-customer-search" placeholder="Phone or name..." class="search-input">
            <button type="button" class="btn-secondary btn-sm" data-goto="customer-form">Add new</button>
          </div>
          <div id="draft-customer-selected" class="customer-selected hidden"></div>
        </div>
        <div class="cart-section">
          <h4>Cart</h4>
          <div id="draft-cart-items" class="cart-items"></div>
          <div class="cart-totals">
            <div class="totals-row"><span>Subtotal</span><span id="cart-subtotal">$0.00</span></div>
            <div class="totals-row" id="cart-tax-row"><span>Tax</span><span id="cart-tax">$0.00</span></div>
            <div class="totals-row" id="cart-fees-row"><span>Fees</span><span id="cart-fees">$0.00</span></div>
            <div class="totals-row total"><span>Total</span><span id="cart-total">$0.00</span></div>
          </div>
        </div>
        <div class="draft-actions">
          <button type="button" class="btn-secondary" id="draft-save">Save Draft</button>
          <button type="button" class="btn-primary" id="draft-accept">Accept Order</button>
          <button type="button" class="btn-secondary" id="draft-cancel">Cancel</button>
        </div>
      </div>
    </div>
  `;

  // Draft state
  let draftCart = [];
  let draftCustomer = null;

  const updateCartDisplay = () => {
    const settings = getSettings();
    let subtotal = 0;
    draftCart.forEach(line => { subtotal += (line.quantity || line.weight || 0) * (line.unitPrice || 0); });
    const tax = settings.taxEnabled ? subtotal * (settings.taxPercent / 100) : 0;
    const fees = settings.feesEnabled ? settings.feeValue : 0;
    const total = subtotal + tax + fees;

    $('#cart-subtotal').textContent = `$${subtotal.toFixed(2)}`;
    $('#cart-tax').textContent = `$${tax.toFixed(2)}`;
    $('#cart-fees').textContent = `$${fees.toFixed(2)}`;
    $('#cart-total').textContent = `$${total.toFixed(2)}`;
    $('#cart-tax-row').style.display = settings.taxEnabled ? 'flex' : 'none';
    $('#cart-fees-row').style.display = settings.feesEnabled ? 'flex' : 'none';

    const cartEl = $('#draft-cart-items');
    cartEl.innerHTML = draftCart.map((line, i) => `
      <div class="cart-line" data-index="${i}">
        <span class="cart-line-name">${line.productName}</span>
        ${line.pricingType === 'PER_LB' ? `
          <input type="number" step="0.01" min="0.1" value="${line.weight}" class="weight-input" data-index="${i}">
          <span>lb × $${line.unitPrice}</span>
        ` : `
          <input type="number" min="1" value="${line.quantity}" class="qty-input" data-index="${i}">
          <span>× $${line.unitPrice}</span>
        `}
        <span class="cart-line-total">$${((line.quantity || line.weight || 0) * line.unitPrice).toFixed(2)}</span>
        <button type="button" class="icon-btn-sm" data-remove="${i}">×</button>
      </div>
    `).join('') || '<div class="cart-empty">Cart is empty</div>';
  };

  $$('.product-card', content).forEach(card => {
    card.addEventListener('click', () => {
      const p = JSON.parse(card.dataset.product);
      const existing = draftCart.find(l => l.productId === p.id);
      if (existing) {
        if (p.pricingType === 'PER_LB') existing.weight = (existing.weight || 1) + 0.5;
        else existing.quantity = (existing.quantity || 1) + 1;
      } else {
        draftCart.push({
          productId: p.id,
          productName: p.name,
          category: p.category,
          pricingType: p.pricingType,
          unitPrice: p.price,
          quantity: p.pricingType === 'FIXED' ? 1 : 0,
          weight: p.pricingType === 'PER_LB' ? 1 : 0,
        });
      }
      updateCartDisplay();
    });
  });

  content.addEventListener('change', e => {
    if (e.target.classList.contains('qty-input')) {
      const i = parseInt(e.target.dataset.index, 10);
      draftCart[i].quantity = Math.max(1, parseInt(e.target.value, 10) || 1);
      updateCartDisplay();
    }
    if (e.target.classList.contains('weight-input')) {
      const i = parseInt(e.target.dataset.index, 10);
      draftCart[i].weight = Math.max(0.1, parseFloat(e.target.value) || 0.1);
      updateCartDisplay();
    }
  });
  content.addEventListener('click', e => {
    if (e.target.dataset.remove !== undefined) {
      draftCart.splice(parseInt(e.target.dataset.remove, 10), 1);
      updateCartDisplay();
    }
  });

  $('#draft-save').addEventListener('click', () => {
    if (!draftCustomer) { showToast('Select a customer first', 'error'); return; }
    if (draftCart.length === 0) { showToast('Add at least one item', 'error'); return; }
    const settings = getSettings();
    let subtotal = 0;
    draftCart.forEach(l => { subtotal += (l.quantity || l.weight || 0) * l.unitPrice; });
    const total = subtotal + (settings.taxEnabled ? subtotal * settings.taxPercent / 100 : 0) + (settings.feesEnabled ? settings.feeValue : 0);
    const order = {
      id: Date.now().toString(),
      orderNumber: null,
      invoiceNumber: null,
      customerId: draftCustomer.id,
      status: 'Draft',
      paymentStatus: null,
      items: draftCart.map(l => ({ ...l, lineTotal: (l.quantity || l.weight || 0) * l.unitPrice })),
      subtotal, total,
      tax: settings.taxEnabled ? subtotal * settings.taxPercent / 100 : 0,
      fees: settings.feesEnabled ? settings.feeValue : 0,
      createdAt: new Date().toISOString(),
      createdBy: getCurrentUser().id,
      timeline: [{ action: 'Created Draft', by: getCurrentUser().name, at: new Date().toISOString() }],
    };
    const orders = getOrders();
    orders.push(order);
    saveOrders(orders);
    showToast('Draft saved');
    showPage('order-details', order.id);
  });

  $('#draft-accept').addEventListener('click', () => {
    if (!draftCustomer) { showToast('Select a customer first', 'error'); return; }
    if (draftCart.length === 0) { showToast('Add at least one item', 'error'); return; }
    openAcceptOrderModal(draftCart, draftCustomer, null);
  });

  $('#draft-cancel', content).addEventListener('click', () => showPage('orders-list'));

  // Customer search in draft - show dropdown of matches
  const draftCustomerResults = document.createElement('div');
  draftCustomerResults.id = 'draft-customer-results';
  draftCustomerResults.className = 'customer-results-dropdown hidden';
  $('.customer-selector', content).appendChild(draftCustomerResults);

  $('#draft-customer-search', content).addEventListener('input', () => {
    const q = $('#draft-customer-search', content).value.trim();
    if (q.length < 2) { draftCustomerResults.classList.add('hidden'); return; }
    const matches = findCustomerByPhoneOrName(q);
    if (matches.length === 0) {
      draftCustomerResults.classList.remove('hidden');
      draftCustomerResults.innerHTML = '<div class="search-no-results">No customer found. <a href="#" class="link-btn" data-goto="customer-form">Create new</a></div>';
    } else {
      draftCustomerResults.classList.remove('hidden');
      draftCustomerResults.innerHTML = matches.map(c => `
        <div class="search-result-item" data-select-customer="${c.id}">
          <strong>${c.name}</strong> — ${c.phone || '-'}
        </div>
      `).join('');
    }
    bindDataLinks(draftCustomerResults);
  });

  content.addEventListener('click', e => {
    if (e.target.dataset.clearCustomer) {
      draftCustomer = null;
      $('#draft-customer-selected', content).classList.add('hidden');
      $('#draft-customer-search', content).value = '';
    }
    const customerId = e.target.closest('[data-select-customer]')?.dataset.selectCustomer;
    if (customerId) {
      draftCustomer = getCustomers().find(c => c.id === customerId);
      if (draftCustomer) {
        $('#draft-customer-selected', content).classList.remove('hidden');
        $('#draft-customer-selected', content).innerHTML = `Customer: ${draftCustomer.name} (${draftCustomer.phone}) <button type="button" class="link-btn" data-clear-customer>Change</button>`;
        $('#draft-customer-search', content).value = draftCustomer.name;
        draftCustomerResults.classList.add('hidden');
      }
    }
  });

  updateCartDisplay();
  bindDataLinks(content);
}

// ============ ACCEPT ORDER MODAL ============
function openAcceptOrderModal(items, customer, existingOrderId) {
  const settings = getSettings();
  let subtotal = 0;
  items.forEach(l => { subtotal += (l.quantity || l.weight || 0) * l.unitPrice; });
  const total = subtotal + (settings.taxEnabled ? subtotal * settings.taxPercent / 100 : 0) + (settings.feesEnabled ? settings.feeValue : 0);

  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal accept-order-modal">
      <h3>Accept Order</h3>
      <p>Customer: ${customer.name} (${customer.phone})</p>
      <div class="order-summary">
        ${items.map(l => `<div>${l.productName}: ${(l.quantity || l.weight)} × $${l.unitPrice} = $${((l.quantity || l.weight) * l.unitPrice).toFixed(2)}</div>`).join('')}
        <div class="total-line">Total: $${total.toFixed(2)}</div>
      </div>
      <div class="communication-options">
        <label><input type="checkbox" id="accept-send-email" ${customer.email ? 'checked' : ''}> Send Invoice Email</label>
        ${!customer.email ? '<span class="text-warning">No email on file</span>' : ''}
        <label><input type="checkbox" id="accept-send-sms" checked> Send Invoice SMS</label>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn-secondary" data-close-modal>Cancel</button>
        <button type="button" class="btn-primary" id="accept-confirm">Accept & Send Invoice</button>
      </div>
    </div>
  `;

  modal.addEventListener('click', e => {
    if (e.target.dataset.closeModal || e.target === modal) modal.remove();
  });

  $('#accept-confirm', modal).addEventListener('click', () => {
    const sendEmail = $('#accept-send-email', modal)?.checked;
    const sendSms = $('#accept-send-sms', modal)?.checked;
    const orderNum = getNextOrderNumber();
    const invNum = getNextInvoiceNumber();

    const order = existingOrderId ? getOrders().find(o => o.id === existingOrderId) : null;
    let newOrder;
    if (order) {
      order.orderNumber = orderNum;
      order.invoiceNumber = invNum;
      order.status = 'Accepted';
      order.timeline.push({ action: 'Accepted', invoiceSent: { email: sendEmail ? 'Sent' : 'Skipped', sms: sendSms ? 'Sent' : 'Skipped' }, by: getCurrentUser().name, at: new Date().toISOString() });
      const orders = getOrders();
      const idx = orders.findIndex(o => o.id === order.id);
      orders[idx] = order;
      saveOrders(orders);
      newOrder = order;
    } else {
      newOrder = {
        id: Date.now().toString(),
        orderNumber: orderNum,
        invoiceNumber: invNum,
        customerId: customer.id,
        status: 'Accepted',
        paymentStatus: 'Awaiting Payment',
        items,
        subtotal,
        total,
        tax: settings.taxEnabled ? subtotal * settings.taxPercent / 100 : 0,
        fees: settings.feesEnabled ? settings.feeValue : 0,
        createdAt: new Date().toISOString(),
        createdBy: getCurrentUser().id,
        timeline: [{ action: 'Accepted', invoiceSent: { email: sendEmail ? 'Sent' : 'Skipped', sms: sendSms ? 'Sent' : 'Skipped' }, by: getCurrentUser().name, at: new Date().toISOString() }],
      };
      const orders = getOrders();
      orders.push(newOrder);
      saveOrders(orders);
    }
    addMessage({ orderId: newOrder.id, type: 'Invoice', channel: 'Email', status: sendEmail ? 'Sent' : 'Skipped', triggeredBy: getCurrentUser().name });
    addMessage({ orderId: newOrder.id, type: 'Invoice', channel: 'SMS', status: sendSms ? 'Sent' : 'Skipped', triggeredBy: getCurrentUser().name });
    modal.remove();
    showToast('Order accepted & invoice sent');
    showPage('order-details', newOrder.id);
  });

  document.body.appendChild(modal);
}

// ============ ORDER DETAILS ============
function renderOrderDetails(orderId) {
  const content = $('#page-order-details .page-content-inner');
  if (!content) return;

  const order = getOrders().find(o => o.id === orderId);
  if (!order) {
    showToast('Order not found', 'error');
    showPage('orders-list');
    return;
  }

  const customer = getCustomers().find(c => c.id === order.customerId);
  const statusFlow = ['Draft', 'Accepted', 'Processing', 'Prepared', 'Delivered', 'Awaiting Payment', 'Paid', 'Closed'];
  const currentIdx = statusFlow.indexOf(order.status);
  const canAdvance = !['Closed', 'Cancelled', 'Draft'].includes(order.status);
  const canRecordPayment = order.status === 'Delivered' || order.status === 'Awaiting Payment';
  const canClose = order.paymentStatus === 'Paid' && order.status !== 'Closed';

  content.innerHTML = `
    <div class="order-details-header">
      <div>
        <h2>${order.orderNumber || 'Draft'} ${order.invoiceNumber ? `— ${order.invoiceNumber}` : ''}</h2>
        ${renderStatusBadge(order.status)} ${order.paymentStatus ? renderPaymentBadge(order.paymentStatus) : ''}
      </div>
    </div>
    <div class="order-details-grid">
      <div class="order-panel">
        <h4>Customer</h4>
        <p>${(customer || {}).name || '-'}</p>
        <p>${(customer || {}).phone || '-'}</p>
        <p>${(customer || {}).email || 'No email'}</p>
        <div class="panel-actions">
          <button type="button" class="btn-secondary btn-sm">Send SMS</button>
          <button type="button" class="btn-secondary btn-sm">Send Email</button>
        </div>
        <a href="#" class="btn-primary" data-goto="order-draft">Create Order</a>
      </div>
      <div class="order-panel">
        <h4>Items</h4>
        <table class="table">
          ${(order.items || []).map(line => `
            <tr>
              <td>${line.productName}</td>
              <td>${line.pricingType === 'PER_LB' ? `${line.weight} lb` : `×${line.quantity}`}</td>
              <td>$${line.unitPrice}</td>
              <td>$${((line.quantity || line.weight) * line.unitPrice).toFixed(2)}</td>
            </tr>
          `).join('')}
        </table>
        <div class="totals-panel">
          <div>Subtotal: $${(order.subtotal || 0).toFixed(2)}</div>
          ${order.tax ? `<div>Tax: $${order.tax.toFixed(2)}</div>` : ''}
          ${order.fees ? `<div>Fees: $${order.fees.toFixed(2)}</div>` : ''}
          <div class="total-line">Total: $${(order.total || 0).toFixed(2)}</div>
        </div>
      </div>
      <div class="order-panel">
        <h4>Status Actions</h4>
        <div class="status-stepper">
          ${statusFlow.slice(0, 6).map((s, i) => `
            <div class="stepper-step ${i <= currentIdx ? 'done' : ''}">${s}</div>
          `).join('')}
        </div>
        <div class="status-actions">
          ${order.status === 'Draft' ? `<button type="button" class="btn-primary" id="accept-existing-order">Accept Order</button>` : ''}
          ${order.status === 'Accepted' ? `<button type="button" class="btn-primary" data-advance-status="${orderId}">Move to Processing</button>` : ''}
          ${order.status === 'Processing' ? `<button type="button" class="btn-primary" data-advance-status="${orderId}">Move to Prepared</button>` : ''}
          ${order.status === 'Prepared' ? `<button type="button" class="btn-primary" data-advance-status="${orderId}">Move to Delivered</button>` : ''}
          ${canRecordPayment ? `<button type="button" class="btn-primary" id="record-payment-btn">Record Payment</button>` : ''}
          ${canClose ? `<button type="button" class="btn-primary" id="close-order-btn">Close Order</button>` : ''}
          ${!['Delivered', 'Awaiting Payment', 'Paid', 'Closed', 'Cancelled'].includes(order.status) ? `<button type="button" class="btn-secondary" id="cancel-order-btn">Cancel Order</button>` : ''}
        </div>
        <div class="notification-actions">
          ${order.invoiceNumber ? `<button type="button" class="btn-secondary btn-sm">Resend Invoice</button>` : ''}
          <button type="button" class="btn-secondary btn-sm">Send Status Update</button>
        </div>
      </div>
      <div class="order-panel">
        <h4>Audit Timeline</h4>
        <div class="audit-timeline">
          ${(order.timeline || []).map(t => `
            <div class="timeline-item">
              <span class="timeline-action">${t.action}</span>
              <span class="timeline-meta">${t.by} — ${formatDateTime(t.at)}</span>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="order-panel">
        <h4>Message Log</h4>
        <div class="message-log">
          ${(getMessages().filter(m => m.orderId === orderId) || []).map(m => `
            <div class="log-item">${m.type} (${m.channel}): ${m.status} — ${m.triggeredBy}</div>
          `).join('') || '<div class="empty-state">No messages</div>'}
        </div>
      </div>
    </div>
    <div class="order-details-actions">
      <button type="button" class="btn-secondary" data-print-order="${orderId}">Print Invoice</button>
      <button type="button" class="btn-secondary" data-print-order-details="${orderId}">Print Order Details</button>
    </div>
  `;

  if ($('#accept-existing-order')) {
    $('#accept-existing-order').addEventListener('click', () => openAcceptOrderModal(order.items, customer, order.id));
  }
  if ($('#record-payment-btn')) {
    $('#record-payment-btn').addEventListener('click', () => openRecordPaymentModal(orderId));
  }
  if ($('#close-order-btn')) {
    $('#close-order-btn').addEventListener('click', () => openCloseOrderModal(orderId));
  }
  if ($('#cancel-order-btn')) {
    $('#cancel-order-btn').addEventListener('click', () => openCancelOrderModal(orderId));
  }
  bindDataLinks(content);
  content.addEventListener('click', e => {
    if (e.target.dataset.advanceStatus) {
      advanceOrderStatus(e.target.dataset.advanceStatus);
    }
  });
}

function advanceOrderStatus(orderId) {
  const orders = getOrders();
  const order = orders.find(o => o.id === orderId);
  if (!order) return;
  const next = { Accepted: 'Processing', Processing: 'Prepared', Prepared: 'Delivered' }[order.status];
  if (!next) return;
  order.status = next;
  if (next === 'Delivered') order.status = 'Awaiting Payment';
  order.timeline = order.timeline || [];
  order.timeline.push({ action: `Moved to ${next}`, by: getCurrentUser().name, at: new Date().toISOString() });
  saveOrders(orders);
  showToast(`Order moved to ${next}`);
  renderOrderDetails(orderId);
}

// ============ RECORD PAYMENT MODAL ============
function openRecordPaymentModal(orderId) {
  const order = getOrders().find(o => o.id === orderId);
  if (!order) return;

  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal">
      <h3>Record Payment</h3>
      <div class="form-group">
        <label>Payment Method</label>
        <select id="payment-method"><option value="COD">COD</option><option value="Card">Card</option></select>
      </div>
      <div class="form-group">
        <label>Amount Due</label>
        <input type="text" value="$${order.total.toFixed(2)}" readonly>
      </div>
      <div class="form-group">
        <label>Amount Received</label>
        <input type="number" step="0.01" id="payment-amount" value="${order.total}">
      </div>
      <div class="form-group">
        <label>Transaction Reference (optional)</label>
        <input type="text" id="payment-ref" placeholder="Reference">
      </div>
      <div class="form-group">
        <label><input type="checkbox" id="payment-send-receipt"> Send Receipt (Email/SMS)</label>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn-secondary" data-close-modal>Cancel</button>
        <button type="button" class="btn-primary" id="payment-save">Save</button>
      </div>
    </div>
  `;

  modal.addEventListener('click', e => {
    if (e.target.dataset.closeModal || e.target === modal) modal.remove();
  });

  $('#payment-save', modal).addEventListener('click', () => {
    const method = $('#payment-method', modal).value;
    const amount = parseFloat($('#payment-amount', modal).value) || order.total;
    const ref = $('#payment-ref', modal).value;
    const sendReceipt = $('#payment-send-receipt', modal).checked;

    order.paymentStatus = 'Paid';
    order.status = 'Paid';
    order.payment = { method, amount, ref, at: new Date().toISOString() };
    order.timeline = order.timeline || [];
    order.timeline.push({ action: `Payment recorded: $${amount} (${method})`, by: getCurrentUser().name, at: new Date().toISOString() });
    const orders = getOrders();
    const idx = orders.findIndex(o => o.id === orderId);
    orders[idx] = order;
    saveOrders(orders);
    if (sendReceipt) addMessage({ orderId, type: 'Receipt', channel: 'Email', status: 'Sent', triggeredBy: getCurrentUser().name });
    modal.remove();
    showToast('Payment recorded');
    renderOrderDetails(orderId);
  });

  document.body.appendChild(modal);
}

// ============ CLOSE ORDER MODAL ============
function openCloseOrderModal(orderId) {
  const order = getOrders().find(o => o.id === orderId);
  if (!order) return;

  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal">
      <h3>Close Order</h3>
      <p>Are you sure you want to close this order? It will become read-only.</p>
      <div class="form-group">
        <label>Notes (optional)</label>
        <input type="text" id="close-notes" placeholder="Notes">
      </div>
      <div class="modal-actions">
        <button type="button" class="btn-secondary" data-close-modal>Cancel</button>
        <button type="button" class="btn-primary" id="close-confirm">Close Order</button>
      </div>
    </div>
  `;

  modal.addEventListener('click', e => {
    if (e.target.dataset.closeModal || e.target === modal) modal.remove();
  });

  $('#close-confirm', modal).addEventListener('click', () => {
    order.status = 'Closed';
    order.timeline = order.timeline || [];
    order.timeline.push({ action: 'Order closed', by: getCurrentUser().name, at: new Date().toISOString() });
    const orders = getOrders();
    const idx = orders.findIndex(o => o.id === orderId);
    orders[idx] = order;
    saveOrders(orders);
    modal.remove();
    showToast('Order closed');
    renderOrderDetails(orderId);
  });

  document.body.appendChild(modal);
}

// ============ CANCEL ORDER MODAL ============
function openCancelOrderModal(orderId) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal">
      <h3>Cancel Order</h3>
      <p>Reason required:</p>
      <div class="form-group">
        <textarea id="cancel-reason" rows="3" required placeholder="Reason for cancellation"></textarea>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn-secondary" data-close-modal>Cancel</button>
        <button type="button" class="btn-primary" id="cancel-confirm">Cancel Order</button>
      </div>
    </div>
  `;

  modal.addEventListener('click', e => {
    if (e.target.dataset.closeModal || e.target === modal) modal.remove();
  });

  $('#cancel-confirm', modal).addEventListener('click', () => {
    const reason = $('#cancel-reason', modal).value.trim();
    if (!reason) { showToast('Enter a reason', 'error'); return; }
    const orders = getOrders();
    const order = orders.find(o => o.id === orderId);
    if (order) {
      order.status = 'Cancelled';
      order.cancelReason = reason;
      order.timeline = order.timeline || [];
      order.timeline.push({ action: `Cancelled: ${reason}`, by: getCurrentUser().name, at: new Date().toISOString() });
      saveOrders(orders);
    }
    modal.remove();
    showToast('Order cancelled');
    showPage('order-details', orderId);
  });

  document.body.appendChild(modal);
}

// ============ CUSTOMERS ============
function renderCustomersList() {
  const content = $('#page-customers .page-content-inner');
  if (!content) return;

  const customers = getCustomers();
  content.innerHTML = `
    <div class="table-toolbar">
      <input type="text" class="search-input" id="customers-search" placeholder="Search customers...">
      <button type="button" class="btn-primary" data-goto="customer-form">Add Customer</button>
    </div>
    <div class="card">
      <table class="table">
        <thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Orders</th><th>Actions</th></tr></thead>
        <tbody>
          ${customers.map(c => {
            const orderCount = getOrders().filter(o => o.customerId === c.id).length;
            return `<tr>
              <td>${c.name}</td>
              <td>${c.phone || '-'}</td>
              <td>${c.email || '-'}</td>
              <td>${orderCount}</td>
              <td><a href="#" class="link-btn" data-goto="customer-profile" data-id="${c.id}">View</a></td>
            </tr>`;
          }).join('') || '<tr><td colspan="5" class="empty-cell">No customers</td></tr>'}
        </tbody>
      </table>
    </div>
  `;
  bindDataLinks(content);
}

function renderCustomerForm(customerId) {
  const content = $('#page-customer-form .page-content-inner');
  if (!content) return;

  const customer = customerId ? getCustomers().find(c => c.id === customerId) : null;
  content.innerHTML = `
    <div class="card form-card">
      <h3>${customer ? 'Edit' : 'Add'} Customer</h3>
      <form id="customer-form">
        <div class="form-group">
          <label>Name *</label>
          <input type="text" name="name" value="${(customer || {}).name || ''}" required>
        </div>
        <div class="form-group">
          <label>Phone *</label>
          <input type="tel" name="phone" value="${(customer || {}).phone || ''}" required>
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" name="email" value="${(customer || {}).email || ''}">
        </div>
        <div class="form-group">
          <label>Notes</label>
          <textarea name="notes" rows="3">${(customer || {}).notes || ''}</textarea>
        </div>
        <div class="form-actions">
          <button type="button" class="btn-secondary" data-goto="customers-list">Cancel</button>
          <button type="submit" class="btn-primary">Save</button>
        </div>
      </form>
    </div>
  `;

  $('#customer-form').addEventListener('submit', e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const customers = getCustomers();
    const data = { name: fd.get('name'), phone: fd.get('phone'), email: fd.get('email'), notes: fd.get('notes') };
    if (customer) {
      const idx = customers.findIndex(c => c.id === customerId);
      customers[idx] = { ...customer, ...data };
    } else {
      customers.push({ id: Date.now().toString(), ...data });
    }
    saveCustomers(customers);
    showToast('Customer saved');
    showPage('customers-list');
  });
  bindDataLinks(content);
}

function renderCustomerProfile(customerId) {
  const content = $('#page-customer-profile .page-content-inner');
  if (!content) return;

  const customer = getCustomers().find(c => c.id === customerId);
  if (!customer) {
    showPage('customers-list');
    return;
  }

  const orders = getOrders().filter(o => o.customerId === customerId);
  content.innerHTML = `
    <div class="customer-profile-header">
      <div class="card">
        <h3>${customer.name}</h3>
        <p>Phone: ${customer.phone || '-'}</p>
        <p>Email: ${customer.email || 'No email'}</p>
        <p>${customer.notes || ''}</p>
        <div class="profile-actions">
          <button type="button" class="btn-primary" data-goto="order-draft">Create Order</button>
          <button type="button" class="btn-secondary" data-goto="customer-form" data-id="${customer.id}">Edit</button>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><h2 class="card-title">Order History</h2></div>
      <table class="table">
        <thead><tr><th>Order #</th><th>Date</th><th>Status</th><th>Total</th><th>Actions</th></tr></thead>
        <tbody>
          ${orders.map(o => `
            <tr>
              <td>${o.orderNumber || '-'}</td>
              <td>${formatDate(o.createdAt)}</td>
              <td>${renderStatusBadge(o.status)}</td>
              <td>$${(o.total || 0).toFixed(2)}</td>
              <td><a href="#" class="link-btn" data-goto="order-details" data-id="${o.id}">View</a></td>
            </tr>
          `).join('') || '<tr><td colspan="5" class="empty-cell">No orders</td></tr>'}
        </tbody>
      </table>
    </div>
  `;
  bindDataLinks(content);
}

// ============ PRODUCTS ============
function renderProductsList() {
  const content = $('#page-products .page-content-inner');
  if (!content) return;

  const categoryFilter = sessionStorage.getItem('products_category') || '';
  const products = getProducts();
  const filtered = categoryFilter ? products.filter(p => p.category === categoryFilter) : products;

  content.innerHTML = `
    <div class="table-toolbar">
      <input type="text" class="search-input" id="products-search" placeholder="Search products...">
      <select id="products-category"><option value="">All categories</option>${['Homemade', 'Groceries', 'Raw Meat'].map(c => `<option value="${c}" ${categoryFilter === c ? 'selected' : ''}>${c}</option>`).join('')}</select>
      <select id="products-active"><option value="">All</option><option value="true">Active</option><option value="false">Inactive</option></select>
      <button type="button" class="btn-primary" data-open-modal="add-product">Add Product</button>
    </div>
    <div class="card">
      <table class="table">
        <thead><tr><th>Name</th><th>Category</th><th>Pricing</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          ${filtered.map(p => `
            <tr>
              <td>${p.name}</td>
              <td>${p.category}</td>
              <td>${p.pricingType === 'PER_LB' ? 'Per lb' : 'Fixed'}</td>
              <td>${p.pricingType === 'PER_LB' ? `$${p.price}/lb` : `$${p.price}`}</td>
              <td><span class="badge ${p.active ? 'badge-success' : 'badge-secondary'}">${p.active ? 'Active' : 'Inactive'}</span></td>
              <td><a href="#" class="link-btn" data-edit-product="${p.id}">Edit</a></td>
            </tr>
          `).join('') || '<tr><td colspan="6" class="empty-cell">No products</td></tr>'}
        </tbody>
      </table>
    </div>
  `;

  $('#products-category').addEventListener('change', e => {
    sessionStorage.setItem('products_category', e.target.value);
    renderProductsList();
  });
  content.addEventListener('click', e => {
    if (e.target.closest('[data-open-modal="add-product"]')) openAddProductModal();
    if (e.target.closest('[data-edit-product]')) openEditProductModal(e.target.closest('[data-edit-product]').dataset.editProduct);
  });
  bindDataLinks(content);
}

function openAddProductModal(productId = null) {
  const product = productId ? getProducts().find(p => p.id === productId) : null;
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal">
      <h3>${product ? 'Edit' : 'Add'} Product</h3>
      <form id="product-form">
        <div class="form-group">
          <label>Item Name *</label>
          <input type="text" id="product-name" value="${(product || {}).name || ''}" required>
        </div>
        <div class="form-group">
          <label>Category *</label>
          <select id="product-category"><option value="Homemade">Homemade</option><option value="Groceries">Groceries</option><option value="Raw Meat">Raw Meat</option></select>
        </div>
        <div class="form-group">
          <label>Pricing Type</label>
          <select id="product-pricing-type"><option value="FIXED">Fixed per item</option><option value="PER_LB">Per lb</option></select>
        </div>
        <div class="form-group">
          <label id="product-price-label">Price *</label>
          <input type="number" step="0.01" id="product-price" value="${(product || {}).price || ''}" required>
        </div>
        <div class="form-group">
          <label><input type="checkbox" id="product-active" ${!(product && !product.active) ? 'checked' : ''}> Active</label>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn-secondary" data-close-modal>Cancel</button>
          <button type="submit" class="btn-primary">Save</button>
        </div>
      </form>
    </div>
  `;
  if (product) {
    $('#product-category', modal).value = product.category;
    $('#product-pricing-type', modal).value = product.pricingType || 'FIXED';
  }
  $('#product-pricing-type', modal).addEventListener('change', () => {
    $('#product-price-label', modal).textContent = $('#product-pricing-type', modal).value === 'PER_LB' ? 'Price per lb *' : 'Price *';
  });
  modal.addEventListener('click', e => { if (e.target.dataset.closeModal || e.target === modal) modal.remove(); });
  $('#product-form', modal).addEventListener('submit', (e) => {
    e.preventDefault();
    const products = getProducts();
    const data = {
      name: $('#product-name', modal).value.trim(),
      category: $('#product-category', modal).value,
      pricingType: $('#product-pricing-type', modal).value,
      price: parseFloat($('#product-price', modal).value) || 0,
      active: $('#product-active', modal).checked,
    };
    if (product) {
      const idx = products.findIndex(p => p.id === productId);
      products[idx] = { ...product, ...data };
    } else {
      products.push({ id: Date.now().toString(), ...data });
    }
    saveProducts(products);
    modal.remove();
    showToast('Product saved');
    renderProductsList();
  });
  document.body.appendChild(modal);
}

function openEditProductModal(id) {
  openAddProductModal(id);
}

// ============ USERS ============
function renderUsersList() {
  const content = $('#page-users .page-content-inner');
  if (!content) return;

  const users = getUsers();
  const currentUser = getCurrentUser();
  content.innerHTML = `
    <div class="table-toolbar">
      <button type="button" class="btn-primary" data-open-modal="add-user">Add User</button>
    </div>
    <div class="card">
      <table class="table">
        <thead><tr><th>Name</th><th>Username</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          ${users.map(u => `
            <tr>
              <td>${u.name}</td>
              <td>${u.username}</td>
              <td><span class="badge badge-info">${u.role}</span></td>
              <td><span class="badge ${u.active ? 'badge-success' : 'badge-secondary'}">${u.active ? 'Active' : 'Inactive'}</span></td>
              <td>${u.id !== currentUser.id ? '<a href="#" class="link-btn">Edit</a>' : '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
  bindDataLinks(content);
}

// ============ REPORTS ============
function renderReports() {
  const content = $('#page-reports .page-content-inner');
  if (!content) return;

  const orders = getOrders();
  const paid = orders.filter(o => o.paymentStatus === 'Paid');
  const revenue = paid.reduce((s, o) => s + (o.total || 0), 0);
  const awaiting = orders.filter(o => o.status === 'Awaiting Payment').reduce((s, o) => s + (o.total || 0), 0);

  content.innerHTML = `
    <div class="reports-toolbar">
      <select id="report-period"><option>Daily</option><option>Weekly</option><option selected>Monthly</option><option>Yearly</option></select>
      <button type="button" class="btn-secondary" data-export-csv>Export CSV</button>
      <button type="button" class="btn-secondary" data-print-report>Print Report</button>
    </div>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-label">Total Orders</div><div class="stat-value">${orders.length}</div></div>
      <div class="stat-card"><div class="stat-label">Total Revenue</div><div class="stat-value">$${revenue.toFixed(2)}</div></div>
      <div class="stat-card"><div class="stat-label">Awaiting Payment</div><div class="stat-value">$${awaiting.toFixed(2)}</div></div>
      <div class="stat-card"><div class="stat-label">Cancelled</div><div class="stat-value">${orders.filter(o => o.status === 'Cancelled').length}</div></div>
    </div>
    <div class="card">
      <h3>Sales Report</h3>
      <table class="table">
        <thead><tr><th>Order #</th><th>Customer</th><th>Total</th><th>Status</th></tr></thead>
        <tbody>
          ${orders.slice(-20).reverse().map(o => {
            const cust = getCustomers().find(c => c.id === o.customerId);
            return `<tr><td>${o.orderNumber || '-'}</td><td>${(cust || {}).name || '-'}</td><td>$${(o.total || 0).toFixed(2)}</td><td>${renderStatusBadge(o.status)}</td></tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ============ SETTINGS ============
function renderSettings() {
  const content = $('#page-settings .page-content-inner');
  if (!content) return;

  const s = getSettings();
  content.innerHTML = `
    <div class="card form-card">
      <h3>Business Settings</h3>
      <div class="form-group">
        <label>Business Name</label>
        <input type="text" id="settings-business" value="${s.businessName}">
      </div>
      <div class="form-group">
        <label><input type="checkbox" id="settings-tax" ${s.taxEnabled ? 'checked' : ''}> Enable Tax</label>
        <input type="number" id="settings-tax-pct" value="${s.taxPercent}" min="0" max="100" step="0.01" placeholder="%">
      </div>
      <div class="form-group">
        <label><input type="checkbox" id="settings-fees" ${s.feesEnabled ? 'checked' : ''}> Enable Fees</label>
        <input type="number" id="settings-fee-val" value="${s.feeValue}" min="0" step="0.01" placeholder="Amount">
      </div>
      <h4>Notification Templates</h4>
      <div class="form-group">
        <label>Invoice Email</label>
        <textarea id="settings-inv-email" rows="2">${s.templates?.invoiceEmail || ''}</textarea>
      </div>
      <div class="form-group">
        <label>Invoice SMS</label>
        <textarea id="settings-inv-sms" rows="2">${s.templates?.invoiceSms || ''}</textarea>
      </div>
      <button type="button" class="btn-primary" id="settings-save">Save Settings</button>
    </div>
  `;

  $('#settings-save').addEventListener('click', () => {
    const settings = {
      ...s,
      businessName: $('#settings-business').value,
      taxEnabled: $('#settings-tax').checked,
      taxPercent: parseFloat($('#settings-tax-pct').value) || 0,
      feesEnabled: $('#settings-fees').checked,
      feeValue: parseFloat($('#settings-fee-val').value) || 0,
      templates: {
        ...s.templates,
        invoiceEmail: $('#settings-inv-email').value,
        invoiceSms: $('#settings-inv-sms').value,
      },
    };
    saveSettings(settings);
    showToast('Settings saved');
  });
}

// ============ BINDINGS ============
function bindDataLinks(el) {
  if (!el) return;
  el.addEventListener('click', e => {
    const target = e.target.closest('[data-goto]');
    if (target) {
      e.preventDefault();
      const id = target.dataset.id;
      showPage(target.dataset.goto, id);
    }
  });
}

// ============ PRINT ============
document.addEventListener('click', e => {
  const printBtn = e.target.closest('[data-print-order]');
  if (printBtn) {
    const orderId = printBtn.dataset.printOrder || printBtn.dataset.printOrderDetails;
    const order = getOrders().find(o => o.id === orderId);
    if (order) {
      const customer = getCustomers().find(c => c.id === order.customerId);
      const printWin = window.open('', '_blank');
      printWin.document.write(`
        <html><head><title>Order ${order.orderNumber}</title><style>body{font-family:sans-serif;padding:20px;} table{width:100%;border-collapse:collapse;} th,td{border:1px solid #ccc;padding:8px;} th{background:#f5f5f5;}</style></head>
        <body>
          <h1>Order ${order.orderNumber} — Invoice ${order.invoiceNumber || '-'}</h1>
          <p>Customer: ${(customer || {}).name} | ${(customer || {}).phone}</p>
          <table><tr><th>Item</th><th>Qty/Weight</th><th>Price</th><th>Total</th></tr>
          ${(order.items || []).map(l => `<tr><td>${l.productName}</td><td>${l.quantity || l.weight}</td><td>$${l.unitPrice}</td><td>$${((l.quantity || l.weight) * l.unitPrice).toFixed(2)}</td></tr>`).join('')}
          </table>
          <p><strong>Total: $${(order.total || 0).toFixed(2)}</strong></p>
          <p>${new Date().toLocaleString()}</p>
        </body></html>
      `);
      printWin.document.close();
      printWin.print();
      printWin.close();
    }
  }
});

// ============ INIT ============
document.addEventListener('DOMContentLoaded', () => {
  seedData();
  const user = getCurrentUser();
  if (user) showPage('dashboard');
  else showPage('login');

  // Nav items
  $$('.nav-item').forEach(item => {
    const route = item.dataset.route;
    if (route && !canAccess(route)) item.style.display = 'none';
    else if (route) item.style.display = '';
    item.addEventListener('click', (e) => {
      e.preventDefault();
      if (route && canAccess(route)) {
        if (route === 'dashboard') showPage('dashboard');
        else if (route === 'reports' || route === 'settings') showPage(route);
        else showPage(route + '-list');
      }
    });
  });

  // Create Order button
  $('.top-bar-create-order')?.addEventListener('click', () => showPage('order-draft'));

  // Profile dropdown / logout
  $('.profile-dropdown-btn')?.addEventListener('click', () => {
    const menu = $('.profile-dropdown-menu');
    menu?.classList.toggle('hidden');
  });
  $('.profile-logout')?.addEventListener('click', () => logout());
});
