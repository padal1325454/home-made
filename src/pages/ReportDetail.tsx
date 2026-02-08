import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useApp } from '../state/AppState';

const ReportDetail = () => {
  const { reportId } = useParams();
  const { orders, products, customers, users } = useApp();
  const [range, setRange] = useState('Monthly');
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const inRange = (iso: string) => {
    if (range === 'Daily') {
      return new Date(iso).toDateString() === new Date().toDateString();
    }
    if (range === 'Weekly') {
      const start = new Date();
      start.setDate(start.getDate() - 7);
      return new Date(iso) >= start;
    }
    if (range === 'Monthly') {
      const start = new Date();
      start.setMonth(start.getMonth() - 1);
      return new Date(iso) >= start;
    }
    if (range === 'Yearly') {
      const start = new Date();
      start.setFullYear(start.getFullYear() - 1);
      return new Date(iso) >= start;
    }
    return true;
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (employeeFilter !== 'all' && order.createdBy !== employeeFilter) return false;
      if (!inRange(order.createdAt)) return false;
      return true;
    });
  }, [orders, employeeFilter, range]);

  const salesRows = useMemo(() => {
    return filteredOrders.map(order => {
      const customer = customers.find(c => c.id === order.customerId);
      return {
        id: order.id,
        orderNumber: order.orderNumber,
        customer: customer?.name || '-',
        total: order.total,
        status: order.status,
        paid: order.paymentStatus === 'Paid',
      };
    });
  }, [filteredOrders, customers]);

  const categoryRows = useMemo(() => {
    const totals: Record<string, { revenue: number; items: number }> = {
      Homemade: { revenue: 0, items: 0 },
      Groceries: { revenue: 0, items: 0 },
      'Raw Meat': { revenue: 0, items: 0 },
    };
    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        const category = product?.category || 'Homemade';
        if (categoryFilter !== 'all' && category !== categoryFilter) return;
        totals[category].revenue += item.lineTotal;
        totals[category].items += 1;
      });
    });
    return Object.entries(totals).map(([category, data]) => ({
      category,
      revenue: data.revenue,
      items: data.items,
    }));
  }, [filteredOrders, products, categoryFilter]);

  const paymentRows = useMemo(() => {
    const totals = {
      COD: { count: 0, revenue: 0 },
      Card: { count: 0, revenue: 0 },
    };
    filteredOrders.forEach(order => {
      if (order.paymentStatus === 'Paid' && order.paymentMethod) {
        totals[order.paymentMethod].count += 1;
        totals[order.paymentMethod].revenue += order.total;
      }
    });
    return Object.entries(totals).map(([method, data]) => ({
      method,
      count: data.count,
      revenue: data.revenue,
    }));
  }, [filteredOrders]);

  const title =
    reportId === 'category' ? 'Category Breakdown' :
    reportId === 'payment' ? 'Payment Breakdown' :
    'Sales Report';

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>{title}</h2>
          <p className="text-secondary">Detailed report view for {range} range.</p>
        </div>
        <div className="filter-row">
          <select value={range} onChange={e => setRange(e.target.value)}>
            <option>Daily</option>
            <option>Weekly</option>
            <option>Monthly</option>
            <option>Yearly</option>
            <option>Custom</option>
          </select>
          <select value={employeeFilter} onChange={e => setEmployeeFilter(e.target.value)}>
            <option value="all">All employees</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>{user.name}</option>
            ))}
          </select>
          {reportId === 'category' ? (
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
              <option value="all">All categories</option>
              <option value="Homemade">Homemade</option>
              <option value="Groceries">Groceries</option>
              <option value="Raw Meat">Raw Meat</option>
            </select>
          ) : null}
          <button className="btn-secondary">Export CSV</button>
          <button className="btn-secondary" onClick={() => window.print()}>Print Report</button>
        </div>
      </div>
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              {reportId === 'category' ? (
                <>
                  <th>Category</th>
                  <th>Items</th>
                  <th>Revenue</th>
                </>
              ) : reportId === 'payment' ? (
                <>
                  <th>Method</th>
                  <th>Orders</th>
                  <th>Revenue</th>
                </>
              ) : (
                <>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Paid</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {reportId === 'category' ? (
              categoryRows.map(row => (
                <tr key={row.category}>
                  <td>{row.category}</td>
                  <td>{row.items}</td>
                  <td>${row.revenue.toFixed(2)}</td>
                </tr>
              ))
            ) : reportId === 'payment' ? (
              paymentRows.map(row => (
                <tr key={row.method}>
                  <td>{row.method}</td>
                  <td>{row.count}</td>
                  <td>${row.revenue.toFixed(2)}</td>
                </tr>
              ))
            ) : (
              salesRows.map(row => (
                <tr key={row.id}>
                  <td>{row.orderNumber || '-'}</td>
                  <td>{row.customer}</td>
                  <td>{row.status}</td>
                  <td>${row.total.toFixed(2)}</td>
                  <td>{row.paid ? 'Yes' : 'No'}</td>
                </tr>
              ))
            )}
            {reportId === 'category' ? (
              <tr>
                <td><strong>Total</strong></td>
                <td><strong>{categoryRows.reduce((s, r) => s + r.items, 0)}</strong></td>
                <td><strong>${categoryRows.reduce((s, r) => s + r.revenue, 0).toFixed(2)}</strong></td>
              </tr>
            ) : reportId === 'payment' ? (
              <tr>
                <td><strong>Total</strong></td>
                <td><strong>{paymentRows.reduce((s, r) => s + r.count, 0)}</strong></td>
                <td><strong>${paymentRows.reduce((s, r) => s + r.revenue, 0).toFixed(2)}</strong></td>
              </tr>
            ) : (
              <tr>
                <td><strong>Total</strong></td>
                <td />
                <td />
                <td><strong>${salesRows.reduce((s, r) => s + r.total, 0).toFixed(2)}</strong></td>
                <td />
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportDetail;
