import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useApp } from '../../state/AppState';

const InvoicePrint = () => {
  const { orderId } = useParams();
  const { orders, customers, settings } = useApp();
  const order = orders.find(o => o.id === orderId);
  const customer = customers.find(c => c.id === order?.customerId);

  useEffect(() => {
    setTimeout(() => window.print(), 300);
  }, []);

  if (!order || !customer) return <div className="print-page">Invoice not found.</div>;

  return (
    <div className="print-page">
      <div className="print-header">
        <div>
          <h1>{settings.businessName}</h1>
          <p>Invoice #{order.invoiceNumber}</p>
        </div>
        <div className="print-meta">
          <div>Order #{order.orderNumber}</div>
          <div>{new Date(order.createdAt).toLocaleDateString()}</div>
        </div>
      </div>
      <div className="print-section">
        <h3>Bill To</h3>
        <div>{customer.name}</div>
        <div>{customer.phone}</div>
        <div>{customer.email || '—'}</div>
      </div>
      <table className="print-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty/Weight</th>
            <th>Unit</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map(item => {
            const lineTotal =
              item.pricingType === 'PER_LB'
                ? (item.weightLbs || 0) * item.unitPrice
                : (item.quantity || 0) * item.unitPrice;
            return (
              <tr key={item.id}>
                <td>{item.productName}</td>
                <td>{item.pricingType === 'PER_LB' ? `${item.weightLbs} lb` : item.quantity}</td>
                <td>${item.unitPrice.toFixed(2)}</td>
                <td>${lineTotal.toFixed(2)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="print-totals">
        <div>Subtotal: ${order.subtotal.toFixed(2)}</div>
        <div>Tax: ${order.tax.toFixed(2)}</div>
        <div>Fees: ${order.fees.toFixed(2)}</div>
        <div className="print-total">Total: ${order.total.toFixed(2)}</div>
      </div>
      <p className="print-note">Thank you for your order.</p>
    </div>
  );
};

export default InvoicePrint;
