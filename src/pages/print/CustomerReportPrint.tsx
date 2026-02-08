import { useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useApp } from '../../state/AppState';

const CustomerReportPrint = () => {
  const { customerId } = useParams();
  const location = useLocation();
  const { customers, orders } = useApp();
  const customer = customers.find(c => c.id === customerId);
  const query = new URLSearchParams(location.search);
  const range = query.get('range') || 'all';
  const inRange = (iso: string) => {
    if (range === 'all') return true;
    const now = new Date();
    const created = new Date(iso);
    if (range === 'today') return created.toDateString() === now.toDateString();
    if (range === 'week') {
      const start = new Date(now);
      start.setDate(now.getDate() - 7);
      return created >= start;
    }
    if (range === 'month') {
      const start = new Date(now);
      start.setMonth(now.getMonth() - 1);
      return created >= start;
    }
    return true;
  };
  const customerOrders = orders.filter(o => o.customerId === customerId && inRange(o.createdAt));

  useEffect(() => {
    setTimeout(() => window.print(), 300);
  }, []);

  if (!customer) return <div className="print-page">Customer not found.</div>;

  return (
    <div className="print-page">
      <div className="print-header">
        <div>
          <h1>Customer Order Summary</h1>
          <p>{customer.name}</p>
        </div>
        <div className="print-meta">
          <div>{customer.phone}</div>
          <div>{customer.email || '—'}</div>
          <div>Range: {range}</div>
        </div>
      </div>
      <table className="print-table">
        <thead>
          <tr>
            <th>Order #</th>
            <th>Invoice #</th>
            <th>Status</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {customerOrders.map(order => (
            <tr key={order.id}>
              <td>{order.orderNumber || 'Draft'}</td>
              <td>{order.invoiceNumber || '-'}</td>
              <td>{order.status}</td>
              <td>${order.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CustomerReportPrint;
