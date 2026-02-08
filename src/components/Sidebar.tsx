import { NavLink } from 'react-router-dom';
import { useApp } from '../state/AppState';

const Sidebar = () => {
  const { currentUser } = useApp();
  if (!currentUser) return null;

  const navItems = [
    { to: '/admin', label: 'Dashboard', roles: ['Admin', 'Supervisor', 'Employee'] },
    { to: '/admin/orders', label: 'Orders', roles: ['Admin', 'Supervisor', 'Employee'] },
    { to: '/admin/customers', label: 'Customers', roles: ['Admin', 'Supervisor', 'Employee'] },
    { to: '/admin/products', label: 'Products', roles: ['Admin', 'Supervisor', 'Employee'] },
    { to: '/admin/users', label: 'Users', roles: ['Admin', 'Supervisor'] },
    { to: '/admin/reports', label: 'Reports', roles: ['Admin', 'Supervisor'] },
    { to: '/admin/settings', label: 'Settings', roles: ['Admin'] },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-icon">OMS</div>
          <span>Order Admin</span>
        </div>
      </div>
      <nav className="nav-section">
        <div className="nav-label">Main</div>
        {navItems
          .filter(item => item.roles.includes(currentUser.role))
          .map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span>{item.label}</span>
            </NavLink>
          ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
