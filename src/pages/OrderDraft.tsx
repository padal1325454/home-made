import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../state/AppState';
import Modal from '../components/ui/Modal';
import { OrderItem, Product } from '../types';

const OrderDraft = () => {
  const { products, customers, currentUser, settings, createDraftOrder, acceptOrder, addToast } = useApp();
  const [category, setCategory] = useState<'Homemade' | 'Groceries' | 'Raw Meat'>('Homemade');
  const [search, setSearch] = useState('');
  const [customerQuery, setCustomerQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [showAccept, setShowAccept] = useState(false);
  const [sendEmail, setSendEmail] = useState(true);
  const [sendSms, setSendSms] = useState(true);
  const navigate = useNavigate();

  const customerMatches = useMemo(() => {
    const q = customerQuery.trim().toLowerCase();
    if (!q) return [];
    return customers.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q));
  }, [customerQuery, customers]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter(
      p =>
        p.category === category &&
        p.active &&
        (!q || p.name.toLowerCase().includes(q))
    );
  }, [products, category, search]);

  const calcLineTotal = (item: OrderItem) => {
    const qty = item.pricingType === 'PER_LB' ? item.weightLbs || 0 : item.quantity || 0;
    return qty * item.unitPrice;
  };

  const addItem = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing && product.pricingType === 'FIXED') {
        return prev.map(item =>
          item.productId === product.id
            ? {
                ...item,
                quantity: (item.quantity || 1) + 1,
                lineTotal: ((item.quantity || 1) + 1) * item.unitPrice,
              }
            : item
        );
      }
      const nextItem: OrderItem = {
        id: Math.random().toString(36).slice(2, 9),
        productId: product.id,
        productName: product.name,
        pricingType: product.pricingType,
        unitPrice: product.price,
        quantity: product.pricingType === 'FIXED' ? 1 : undefined,
        weightLbs: product.pricingType === 'PER_LB' ? 1 : undefined,
        lineTotal: product.price,
      };
      return [
        ...prev,
        { ...nextItem, lineTotal: calcLineTotal(nextItem) },
      ];
    });
  };

  const updateItem = (id: string, field: 'quantity' | 'weightLbs', value: number) => {
    setCart(prev =>
      prev.map(item => {
        if (item.id !== id) return item;
        const next = { ...item, [field]: value };
        return { ...next, lineTotal: calcLineTotal(next) };
      })
    );
  };

  const removeItem = (id: string) => setCart(prev => prev.filter(item => item.id !== id));

  const totals = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => {
      const qty = item.pricingType === 'PER_LB' ? item.weightLbs || 0 : item.quantity || 0;
      return sum + qty * item.unitPrice;
    }, 0);
    const tax = settings.taxEnabled ? (subtotal * settings.taxPercent) / 100 : 0;
    const fees = settings.feesEnabled ? settings.feeValue : 0;
    return { subtotal, tax, fees, total: subtotal + tax + fees };
  }, [cart, settings]);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  const saveDraft = () => {
    if (!currentUser || !selectedCustomerId || cart.length === 0) {
      addToast('Select a customer and add items', 'error');
      return;
    }
    const order = createDraftOrder({
      customerId: selectedCustomerId,
      items: cart,
      createdById: currentUser.id,
      createdByName: currentUser.name,
    });
    addToast('Draft saved');
    navigate(`/admin/orders/${order.id}`);
  };

  const accept = () => {
    if (!currentUser || !selectedCustomerId || cart.length === 0) {
      addToast('Select a customer and add items', 'error');
      return;
    }
    setShowAccept(true);
  };

  const confirmAccept = () => {
    if (!currentUser || !selectedCustomerId) return;
    const order = acceptOrder({
      customerId: selectedCustomerId,
      items: cart,
      sendEmail,
      sendSms,
      createdById: currentUser.id,
      createdByName: currentUser.name,
    });
    addToast('Order accepted & invoice sent');
    setShowAccept(false);
    navigate(`/admin/orders/${order.id}`);
  };

  return (
    <div className="page">
      <div className="order-draft-grid">
        <div className="card">
          <div className="card-header">
            <h3>Products</h3>
            <input
              className="search-input"
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="category-tabs">
            {['Homemade', 'Groceries', 'Raw Meat'].map(tab => (
              <button
                key={tab}
                className={`tab ${category === tab ? 'active' : ''}`}
                onClick={() => setCategory(tab as typeof category)}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="product-grid">
            {filteredProducts.map(product => (
              <button key={product.id} className="product-card" onClick={() => addItem(product)}>
                <div className="product-image" />
                <div className="product-info">
                  <strong>{product.name}</strong>
                  <span className="text-secondary">
                    {product.pricingType === 'PER_LB' ? `$${product.price}/lb` : `$${product.price}`}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <h3>Customer</h3>
          <input
            className="search-input"
            placeholder="Search by phone or name..."
            value={customerQuery}
            onChange={e => setCustomerQuery(e.target.value)}
          />
          {customerQuery && (
            <div className="search-results">
              {customerMatches.length === 0 ? (
                <div className="search-empty">
                  No customer found. <button className="link-btn" onClick={() => navigate('/admin/customers/new')}>Create New</button>
                </div>
              ) : (
                customerMatches.map(customer => (
                  <button
                    key={customer.id}
                    className="search-result-item"
                    onClick={() => setSelectedCustomerId(customer.id)}
                  >
                    <strong>{customer.name}</strong>
                    <span>{customer.phone}</span>
                  </button>
                ))
              )}
            </div>
          )}
          {selectedCustomer ? (
            <div className="selected-customer">
              <strong>{selectedCustomer.name}</strong>
              <span>{selectedCustomer.phone}</span>
              <button className="link-btn" onClick={() => setSelectedCustomerId(null)}>Change</button>
            </div>
          ) : null}

          <h3>Cart</h3>
          {cart.length === 0 ? (
            <div className="empty-hint">Add items to start building the order.</div>
          ) : (
            <div className="cart-items">
              {cart.map(item => (
                <div key={item.id} className="cart-item">
                  <div>
                    <strong>{item.productName}</strong>
                    <div className="text-secondary">
                      ${item.unitPrice} {item.pricingType === 'PER_LB' ? '/lb' : ''}
                    </div>
                    <div className="text-secondary">Line total: ${item.lineTotal.toFixed(2)}</div>
                  </div>
                  <div className="cart-controls">
                    {item.pricingType === 'PER_LB' ? (
                      <input
                        type="number"
                        min={0.1}
                        step={0.01}
                        value={item.weightLbs || 1}
                        onChange={e => updateItem(item.id, 'weightLbs', parseFloat(e.target.value || '0'))}
                      />
                    ) : (
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={item.quantity || 1}
                        onChange={e => updateItem(item.id, 'quantity', parseInt(e.target.value || '1', 10))}
                      />
                    )}
                    <button className="link-btn" onClick={() => removeItem(item.id)}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="totals">
            <div className="total-row">
              <span>Subtotal</span>
              <span>${totals.subtotal.toFixed(2)}</span>
            </div>
            {settings.taxEnabled && (
              <div className="total-row">
                <span>Tax</span>
                <span>${totals.tax.toFixed(2)}</span>
              </div>
            )}
            {settings.feesEnabled && (
              <div className="total-row">
                <span>Fees</span>
                <span>${totals.fees.toFixed(2)}</span>
              </div>
            )}
            <div className="total-row total">
              <span>Total</span>
              <span>${totals.total.toFixed(2)}</span>
            </div>
          </div>

          <div className="action-row">
            <button className="btn-secondary" onClick={() => navigate('/admin/orders')}>Cancel</button>
            <button className="btn-secondary" onClick={saveDraft}>Save Draft</button>
            <button className="btn-primary" onClick={accept}>Accept Order</button>
          </div>
        </div>
      </div>

      <Modal
        open={showAccept}
        title="Accept Order"
        onClose={() => setShowAccept(false)}
        footer={
          <div className="modal-actions">
            <button className="btn-secondary" onClick={() => setShowAccept(false)}>Cancel</button>
            <button className="btn-primary" onClick={confirmAccept}>Accept & Send Invoice</button>
          </div>
        }
      >
        <div className="order-summary">
          <div><strong>Customer:</strong> {selectedCustomer?.name} ({selectedCustomer?.phone})</div>
          <div className="summary-items">
            {cart.map(item => (
              <div key={item.id}>
                {item.productName} - {item.pricingType === 'PER_LB' ? item.weightLbs : item.quantity} x ${item.unitPrice}
              </div>
            ))}
          </div>
          <div className="summary-total">Total: ${totals.total.toFixed(2)}</div>
        </div>
        <div className="communication-options">
          <label className="checkbox">
            <input type="checkbox" checked={sendEmail} onChange={e => setSendEmail(e.target.checked)} />
            Send Invoice Email
          </label>
          {!selectedCustomer?.email ? <span className="text-warning">No email on file</span> : null}
          <label className="checkbox">
            <input type="checkbox" checked={sendSms} onChange={e => setSendSms(e.target.checked)} />
            Send Invoice SMS
          </label>
        </div>
      </Modal>
    </div>
  );
};

export default OrderDraft;
