import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../state/AppState';
import Badge from '../components/ui/Badge';
import Tabs from '../components/ui/Tabs';
import Modal from '../components/ui/Modal';
import Pagination from '../components/ui/Pagination';
import { statusVariant } from '../utils/order';

const OrdersList = () => {
  const { orders, customers, users, resendInvoice, addToast, currentUser } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState('active');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [resendId, setResendId] = useState<string | null>(null);
  const [sendEmail, setSendEmail] = useState(true);
  const [sendSms, setSendSms] = useState(true);

  const isInRange = (iso: string) => {
    if (dateRange === 'all') return true;
    const now = new Date();
    const created = new Date(iso);
    if (dateRange === 'today') {
      return created.toDateString() === now.toDateString();
    }
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter(order => {
      const matches =
        !q ||
        order.orderNumber?.toLowerCase().includes(q) ||
        order.invoiceNumber?.toLowerCase().includes(q) ||
        (customers.find(c => c.id === order.customerId)?.name || '').toLowerCase().includes(q);
      if (!matches) return false;
      if (statusFilter !== 'all' && order.status !== statusFilter) return false;
      if (paymentFilter !== 'all' && order.paymentStatus !== paymentFilter) return false;
      if (employeeFilter !== 'all' && order.createdBy !== employeeFilter) return false;
      if (!isInRange(order.createdAt)) return false;
      if (tab === 'draft') return order.status === 'Draft';
      if (tab === 'awaiting') return order.paymentStatus === 'Awaiting Payment';
      if (tab === 'closed') return order.status === 'Closed';
      if (tab === 'cancelled') return order.status === 'Cancelled';
      return ['Accepted', 'Processing', 'Prepared', 'Delivered', 'Awaiting Payment', 'Paid'].includes(order.status);
    });
  }, [orders, customers, search, tab, statusFilter, paymentFilter, employeeFilter, dateRange]);

  const openResend = (orderId: string) => {
    setResendId(orderId);
    setSendEmail(true);
    setSendSms(true);
  };

  const confirmResend = () => {
    if (!resendId || !currentUser) return;
    resendInvoice(resendId, currentUser.name, sendEmail, sendSms);
    addToast('Invoice resent');
    setResendId(null);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Orders</h2>
          <p className="text-secondary">Track orders across the full lifecycle.</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/admin/orders/new')}>Create Order</button>
      </div>
      <div className="card">
        <div className="table-toolbar">
          <Tabs
            tabs={[
              { id: 'draft', label: 'Draft' },
              { id: 'active', label: 'Active' },
              { id: 'awaiting', label: 'Awaiting Payment' },
              { id: 'closed', label: 'Closed' },
              { id: 'cancelled', label: 'Cancelled' },
            ]}
            active={tab}
            onChange={setTab}
          />
          <div className="table-filters">
            <input
              className="search-input"
              placeholder="Search order #, invoice, customer..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="Draft">Draft</option>
              <option value="Accepted">Accepted</option>
              <option value="Processing">Processing</option>
              <option value="Prepared">Prepared</option>
              <option value="Delivered">Delivered</option>
              <option value="Awaiting Payment">Awaiting Payment</option>
              <option value="Paid">Paid</option>
              <option value="Closed">Closed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <select value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)}>
              <option value="all">Payment Status</option>
              <option value="Awaiting Payment">Awaiting Payment</option>
              <option value="Paid">Paid</option>
            </select>
            <select value={employeeFilter} onChange={e => setEmployeeFilter(e.target.value)}>
              <option value="all">Employee</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
            <select value={dateRange} onChange={e => setDateRange(e.target.value)}>
              <option value="all">Date Range</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Invoice #</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Total</th>
              <th>Created by</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="empty-cell">No orders yet.</td>
              </tr>
            ) : (
              filtered.map(order => {
                const customer = customers.find(c => c.id === order.customerId);
                const creator = users.find(u => u.id === order.createdBy);
                return (
                  <tr key={order.id}>
                    <td>{order.orderNumber || 'Draft'}</td>
                    <td>{order.invoiceNumber || '-'}</td>
                    <td>{customer?.name || '-'}</td>
                    <td>
                      <Badge variant={statusVariant(order.status)}>{order.status}</Badge>
                    </td>
                    <td>
                      {order.paymentStatus ? (
                        <Badge variant={order.paymentStatus === 'Paid' ? 'success' : 'warning'}>
                          {order.paymentStatus}
                        </Badge>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>${order.total.toFixed(2)}</td>
                    <td>{creator?.name || '-'}</td>
                    <td>{new Date(order.updatedAt).toLocaleDateString()}</td>
                    <td className="actions-cell">
                      <button className="link-btn" onClick={() => navigate(`/admin/orders/${order.id}`)}>View</button>
                      {order.invoiceNumber ? (
                        <button className="link-btn" onClick={() => navigate(`/admin/print/invoice/${order.id}`)}>Print</button>
                      ) : null}
                      {order.invoiceNumber ? (
                        <button className="link-btn" onClick={() => openResend(order.id)}>Resend</button>
                      ) : null}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        <Pagination />
      </div>
      <Modal
        open={!!resendId}
        title="Resend Invoice"
        onClose={() => setResendId(null)}
        footer={
          <div className="modal-actions">
            <button className="btn-secondary" onClick={() => setResendId(null)}>Cancel</button>
            <button className="btn-primary" onClick={confirmResend}>Resend</button>
          </div>
        }
      >
        <label className="checkbox">
          <input type="checkbox" checked={sendEmail} onChange={e => setSendEmail(e.target.checked)} />
          Send Invoice Email
        </label>
        <label className="checkbox">
          <input type="checkbox" checked={sendSms} onChange={e => setSendSms(e.target.checked)} />
          Send Invoice SMS
        </label>
      </Modal>
    </div>
  );
};

export default OrdersList;
