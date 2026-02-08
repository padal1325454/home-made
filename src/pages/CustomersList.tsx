import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../state/AppState';
import Pagination from '../components/ui/Pagination';

const CustomersList = () => {
  const { customers } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.address || '').toLowerCase().includes(q) ||
        (c.dateOfBirth || '').toLowerCase().includes(q)
    );
  }, [customers, search]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Customers</h2>
          <p className="text-secondary">Manage customer profiles and order history.</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/admin/customers/new')}>
          Add Customer
        </button>
      </div>
      <div className="card">
        <div className="table-toolbar">
          <input
            className="search-input"
            placeholder="Search by name, phone, email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Address</th>
              <th>DOB</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-cell">No customers found.</td>
              </tr>
            ) : (
              filtered.map(customer => (
                <tr key={customer.id}>
                  <td>{customer.name}</td>
                  <td>{customer.phone}</td>
                  <td>{customer.email || '-'}</td>
                  <td>{customer.address || '-'}</td>
                  <td>{customer.dateOfBirth || '-'}</td>
                  <td>{customer.notes || '-'}</td>
                  <td>
                    <button className="link-btn" onClick={() => navigate(`/admin/customers/${customer.id}`)}>View</button>
                    <button className="link-btn" onClick={() => navigate(`/admin/customers/${customer.id}/edit`)}>Edit</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination />
      </div>
    </div>
  );
};

export default CustomersList;
