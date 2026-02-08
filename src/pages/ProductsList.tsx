import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../state/AppState';
import Badge from '../components/ui/Badge';
import Pagination from '../components/ui/Pagination';

const ProductsList = () => {
  const { products } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter(p => {
      if (category !== 'all' && p.category !== category) return false;
      if (activeFilter === 'active' && !p.active) return false;
      if (activeFilter === 'inactive' && p.active) return false;
      if (q && !p.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [products, search, category, activeFilter]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Products & Inventory</h2>
          <p className="text-secondary">Manage inventory across homemade, groceries, and raw meat.</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/admin/products/new')}>Add Product</button>
      </div>
      <div className="card">
        <div className="table-toolbar">
          <input
            className="search-input"
            placeholder="Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="filter-row">
            <select value={category} onChange={e => setCategory(e.target.value)}>
              <option value="all">All categories</option>
              <option value="Homemade">Homemade</option>
              <option value="Groceries">Groceries</option>
              <option value="Raw Meat">Raw Meat</option>
            </select>
            <select value={activeFilter} onChange={e => setActiveFilter(e.target.value)}>
              <option value="all">All status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Category</th>
              <th>Pricing</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty-cell">No products found.</td>
              </tr>
            ) : (
              filtered.map(product => (
                <tr key={product.id}>
                  <td>
                    <div className="product-cell">
                      <div className="product-thumb" />
                      <div>
                        <strong>{product.name}</strong>
                        <div className="text-secondary">{product.description || 'No description'}</div>
                      </div>
                    </div>
                  </td>
                  <td>{product.category}</td>
                  <td>{product.pricingType === 'PER_LB' ? `$${product.price}/lb` : `$${product.price}`}</td>
                  <td>
                    <Badge variant={product.active ? 'success' : 'warning'}>
                      {product.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td>
                    <button className="link-btn" onClick={() => navigate(`/admin/products/${product.id}/edit`)}>
                      Edit
                    </button>
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

export default ProductsList;
