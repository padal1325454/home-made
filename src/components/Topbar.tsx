import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../state/AppState';

const titleMap: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/orders': 'Orders',
  '/admin/orders/new': 'Create Order',
  '/admin/customers': 'Customers',
  '/admin/customers/new': 'Add Customer',
  '/admin/products': 'Products',
  '/admin/users': 'Users',
  '/admin/reports': 'Reports',
  '/admin/settings': 'Settings',
};

const Topbar = () => {
  const { currentUser, logout } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const title = useMemo(() => {
    if (location.pathname.startsWith('/admin/orders/') && location.pathname !== '/admin/orders/new') {
      return 'Order Details';
    }
    if (location.pathname.startsWith('/admin/customers/') && location.pathname.includes('/edit')) {
      return 'Edit Customer';
    }
    if (location.pathname.startsWith('/admin/customers/') && location.pathname !== '/admin/customers/new') {
      return 'Customer Profile';
    }
    if (location.pathname.startsWith('/admin/products/') && location.pathname.includes('/edit')) {
      return 'Edit Product';
    }
    if (location.pathname.startsWith('/admin/reports/') && location.pathname !== '/admin/reports') {
      return 'Report Details';
    }
    return titleMap[location.pathname] || 'Dashboard';
  }, [location.pathname]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return (
    <header className="top-bar">
      <h1 className="top-bar-title">{title}</h1>
      <div className="top-bar-actions">
        <button type="button" className="btn-primary" onClick={() => navigate('/admin/orders/new')}>
          Create Order
        </button>
        <button type="button" className="icon-btn" aria-label="Notifications">
          <span className="icon-dot" />
        </button>
        <div className="profile-dropdown" ref={menuRef}>
          <button
            type="button"
            className="profile-dropdown-btn avatar"
            onClick={() => setMenuOpen(open => !open)}
          >
            {(currentUser?.name || 'AD')
              .split(' ')
              .map(part => part[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)}
          </button>
          <div className={`profile-dropdown-menu ${menuOpen ? 'open' : ''}`}>
            <div className="profile-meta">
              <div className="profile-name">{currentUser?.name}</div>
              <div className="profile-role">{currentUser?.role}</div>
            </div>
            <button type="button" className="link-btn" onClick={() => logout()}>
              Log out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
