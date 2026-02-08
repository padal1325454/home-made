import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../state/AppState';

const ReportsHome = () => {
  const { orders } = useApp();
  const navigate = useNavigate();
  const [range, setRange] = useState('Monthly');

  const summary = useMemo(() => {
    const totalOrders = orders.length;
    const revenue = orders.filter(o => o.paymentStatus === 'Paid').reduce((sum, o) => sum + o.total, 0);
    const awaiting = orders.filter(o => o.paymentStatus === 'Awaiting Payment').reduce((sum, o) => sum + o.total, 0);
    const cancelled = orders.filter(o => o.status === 'Cancelled').length;
    const avg = totalOrders ? revenue / totalOrders : 0;
    return { totalOrders, revenue, awaiting, cancelled, avg };
  }, [orders]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Reports</h2>
          <p className="text-secondary">Track sales, categories, and payments.</p>
        </div>
        <div className="filter-row">
          <select value={range} onChange={e => setRange(e.target.value)}>
            <option>Daily</option>
            <option>Weekly</option>
            <option>Monthly</option>
            <option>Yearly</option>
            <option>Custom</option>
          </select>
          <button className="btn-secondary">Export CSV</button>
          <button className="btn-secondary" onClick={() => window.print()}>Print</button>
        </div>
      </div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Orders</div>
          <div className="stat-value">{summary.totalOrders}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Revenue (Paid)</div>
          <div className="stat-value">${summary.revenue.toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Awaiting Payment</div>
          <div className="stat-value">${summary.awaiting.toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Cancelled</div>
          <div className="stat-value">{summary.cancelled}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg Order Value</div>
          <div className="stat-value">${summary.avg.toFixed(2)}</div>
        </div>
      </div>

      <div className="report-grid">
        <div className="card report-card">
          <h3>Sales Report</h3>
          <p className="text-secondary">Order volume and revenue by period.</p>
          <button className="btn-secondary" onClick={() => navigate('/admin/reports/sales')}>View report</button>
        </div>
        <div className="card report-card">
          <h3>Category Breakdown</h3>
          <p className="text-secondary">Homemade vs Groceries vs Raw Meat.</p>
          <button className="btn-secondary" onClick={() => navigate('/admin/reports/category')}>View report</button>
        </div>
        <div className="card report-card">
          <h3>Payment Breakdown</h3>
          <p className="text-secondary">COD vs Card payment mix.</p>
          <button className="btn-secondary" onClick={() => navigate('/admin/reports/payment')}>View report</button>
        </div>
      </div>
    </div>
  );
};

export default ReportsHome;
