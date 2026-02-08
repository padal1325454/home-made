import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../state/AppState';
import Badge from '../components/ui/Badge';
import { statusVariant } from '../utils/order';

const Dashboard = () => {
  const { currentUser, orders, customers, products } = useApp();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return customers.filter(
      c => c.phone.includes(q) || c.name.toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q)
    );
  }, [customers, query]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayOrders = orders.filter(o => new Date(o.createdAt) >= today);
  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const pendingOrders = orders.filter(o => ['Draft', 'Accepted', 'Processing'].includes(o.status));

  const lowStockItems = products.filter(
    item =>
      typeof item.stockQuantity === 'number' &&
      typeof item.lowStockThreshold === 'number' &&
      item.stockQuantity <= item.lowStockThreshold
  );

  const itemSales = useMemo(() => {
    const map: Record<string, { name: string; count: number; revenue: number }> = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        const key = item.productId;
        if (!map[key]) {
          map[key] = { name: item.productName, count: 0, revenue: 0 };
        }
        const qty = item.pricingType === 'PER_LB' ? item.weightLbs || 0 : item.quantity || 0;
        map[key].count += qty;
        map[key].revenue += item.lineTotal;
      });
    });
    return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [orders]);

  const chartData = useMemo(() => {
    const data: { label: string; revenue: number }[] = [];
    for (let i = 6; i >= 0; i -= 1) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === date.toDateString());
      const revenue = dayOrders.reduce((sum, o) => sum + o.total, 0);
      data.push({
        label: date.toLocaleDateString('en-US', { weekday: 'short' }),
        revenue: Number(revenue.toFixed(2)),
      });
    }
    return data;
  }, [orders]);

  const maxRevenue = Math.max(1, ...chartData.map(d => d.revenue));

  return (
    <div className="page">
      <div className="dashboard-grid">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-secondary">Overview of your business performance</p>
        </div>

        <div className="hero-banner">
          <img
            src="https://images.unsplash.com/photo-1755811248279-1ab13b7d4384?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1400"
            alt="Gourmet food"
          />
          <div className="hero-overlay" />
          <div className="hero-content">
            <h2>Welcome to Your Restaurant Dashboard</h2>
            <p>Manage orders, track performance, and grow your business</p>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card accent-green">
            <div className="stat-label">Today's Revenue</div>
            <div className="stat-value">${todayRevenue.toFixed(2)}</div>
            <div className="text-secondary">{todayOrders.length} orders today</div>
          </div>
          <div className="stat-card accent-blue">
            <div className="stat-label">Total Orders</div>
            <div className="stat-value">{totalOrders}</div>
            <div className="text-secondary">${(totalRevenue / totalOrders || 0).toFixed(2)} avg order</div>
          </div>
          <div className="stat-card accent-amber">
            <div className="stat-label">Pending Orders</div>
            <div className="stat-value">{pendingOrders.length}</div>
            <div className="text-secondary">Requires attention</div>
          </div>
          <div className="stat-card accent-red">
            <div className="stat-label">Low Stock Items</div>
            <div className="stat-value">{lowStockItems.length}</div>
            <div className="text-secondary">Needs restocking</div>
          </div>
        </div>

        <div className="dashboard-split">
          <div className="card">
            <div className="card-header">
              <h3>Revenue (Last 7 Days)</h3>
            </div>
            <div className="chart">
              {chartData.map(day => (
                <div key={day.label} className="chart-bar">
                  <div
                    className="bar-fill"
                    style={{ height: `${(day.revenue / maxRevenue) * 100}%` }}
                  />
                  <span>{day.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>Top Selling Items</h3>
              <button className="link-btn" onClick={() => navigate('/admin/reports')}>View All</button>
            </div>
            <div className="list">
              {itemSales.length === 0 ? (
                <p className="text-secondary">No sales data yet</p>
              ) : (
                itemSales.map(item => (
                  <div key={item.name} className="list-row">
                    <div>
                      <strong>{item.name}</strong>
                      <div className="text-secondary">{item.count} sold</div>
                    </div>
                    <strong>${item.revenue.toFixed(2)}</strong>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="dashboard-split">
          <div className="card">
            <div className="card-header">
              <h3>Pending Orders</h3>
              <button className="link-btn" onClick={() => navigate('/admin/orders')}>View All</button>
            </div>
            <div className="list">
              {pendingOrders.length === 0 ? (
                <p className="text-secondary">No pending orders</p>
              ) : (
                pendingOrders.slice(0, 5).map(order => {
                  const customer = customers.find(c => c.id === order.customerId);
                  return (
                    <button
                      key={order.id}
                      className="list-row clickable"
                      onClick={() => navigate(`/admin/orders/${order.id}`)}
                    >
                      <div>
                        <strong>{customer?.name || 'Unknown'}</strong>
                        <div className="text-secondary">
                          {order.items.length} items · ${order.total.toFixed(2)}
                        </div>
                      </div>
                      <Badge variant={statusVariant(order.status)}>{order.status}</Badge>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>Low Stock Alerts</h3>
              <button className="link-btn" onClick={() => navigate('/admin/products')}>View All</button>
            </div>
            <div className="list">
              {lowStockItems.length === 0 ? (
                <p className="text-secondary">All items in stock</p>
              ) : (
                lowStockItems.slice(0, 5).map(item => (
                  <div key={item.id} className="list-row">
                    <div>
                      <strong>{item.name}</strong>
                      <div className="text-secondary">
                        Stock: {item.stockQuantity} (Low: {item.lowStockThreshold})
                      </div>
                    </div>
                    <Badge variant="warning">
                      {item.stockQuantity === 0 ? 'Out' : 'Low'}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <h3>Customer Search</h3>
          <p className="text-secondary">Find customers by phone, name, or email.</p>
          <div className="search-row">
            <input
              className="search-input"
              placeholder="Phone or name..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            <button className="btn-secondary" onClick={() => query && navigate('/admin/customers')}>
              Search
            </button>
          </div>
          <div className="search-results">
            {query && matches.length === 0 ? (
              <div className="search-empty">
                No customer found. <button className="link-btn" onClick={() => navigate('/admin/customers/new')}>Create New Customer</button>
              </div>
            ) : null}
            {matches.map(customer => (
              <button key={customer.id} className="search-result-item" onClick={() => navigate(`/admin/customers/${customer.id}`)}>
                <strong>{customer.name}</strong>
                <span>{customer.phone}</span>
                <span className="text-secondary">{customer.email || 'No email'}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Current User</h3>
            <Badge variant="info">{currentUser?.role}</Badge>
          </div>
          <p className="text-secondary">Use the sidebar to navigate through orders, customers, inventory, and reports.</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
