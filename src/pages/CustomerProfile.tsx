import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../state/AppState';
import Badge from '../components/ui/Badge';
import { statusVariant } from '../utils/order';

const CustomerProfile = () => {
  const { customerId } = useParams();
  const { customers, orders } = useApp();
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState('all');

  const customer = customers.find(c => c.id === customerId);
  const customerOrders = useMemo(() => {
    const inRange = (iso: string) => {
      if (dateRange === 'all') return true;
      const now = new Date();
      const created = new Date(iso);
      if (dateRange === 'today') return created.toDateString() === now.toDateString();
      if (dateRange === 'week') {
        const start = new Date(now);
        start.setDate(now.getDate() - 7);
        return created >= start;
      }
      if (dateRange === 'month') {
        const start = new Date(now);
        start.setMonth(now.getMonth() - 1);
        return created >= start;
      }
      return true;
    };
    return orders.filter(order => order.customerId === customerId && inRange(order.createdAt));
  }, [orders, customerId, dateRange]);

  if (!customer) {
    return (
      <div className="page">
        <div className="card">Customer not found.</div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>{customer.name}</h2>
          <p className="text-secondary">{customer.phone} - {customer.email || 'No email'}</p>
        </div>
        <div className="actions-row">
          <button className="btn-secondary" onClick={() => navigate(`/admin/customers/${customer.id}/edit`)}>Edit</button>
          <button className="btn-primary" onClick={() => navigate('/admin/orders/new')}>Create Order</button>
        </div>
      </div>
      <div className="card">
        <h3>Customer Info</h3>
        <div className="detail-line">Phone: {customer.phone}</div>
        <div className="detail-line">Email: {customer.email || '—'}</div>
        <div className="detail-line">Address: {customer.address || '—'}</div>
        <div className="detail-line">Date of Birth: {customer.dateOfBirth || '—'}</div>
        <div className="detail-line">Notes: {customer.notes || '—'}</div>
      </div>
      <div className="card">
        <div className="card-header">
          <h3>Order History</h3>
          <div className="filter-row">
            <select value={dateRange} onChange={e => setDateRange(e.target.value)}>
              <option value="all">All time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 days</option>
              <option value="month">Last 30 days</option>
            </select>
            <button
              className="btn-secondary"
              onClick={() => navigate(`/admin/print/customer/${customer.id}?range=${dateRange}`)}
            >
              Print Summary
            </button>
          </div>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Invoice #</th>
              <th>Status</th>
              <th>Total</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {customerOrders.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty-cell">No orders yet.</td>
              </tr>
            ) : (
              customerOrders.map(order => (
                <tr key={order.id}>
                  <td>{order.orderNumber || 'Draft'}</td>
                  <td>{order.invoiceNumber || '-'}</td>
                  <td>
                    <Badge variant={statusVariant(order.status)}>{order.status}</Badge>
                  </td>
                  <td>${order.total.toFixed(2)}</td>
                  <td>
                    <button className="link-btn" onClick={() => navigate(`/admin/orders/${order.id}`)}>View</button>
                    <button className="link-btn" onClick={() => navigate(`/admin/print/order/${order.id}`)}>
                      Print Order
                    </button>
                    {order.invoiceNumber ? (
                      <button className="link-btn" onClick={() => navigate(`/admin/print/invoice/${order.id}`)}>Print</button>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomerProfile;
