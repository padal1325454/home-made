import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../state/AppState';

const ProductForm = () => {
  const { productId } = useParams();
  const { products, upsertProduct, addToast } = useApp();
  const navigate = useNavigate();
  const existing = useMemo(() => products.find(p => p.id === productId), [products, productId]);

  const [name, setName] = useState(existing?.name || '');
  const [category, setCategory] = useState(existing?.category || 'Homemade');
  const [pricingType, setPricingType] = useState(existing?.pricingType || 'FIXED');
  const [price, setPrice] = useState(existing?.price.toString() || '0');
  const [active, setActive] = useState(existing?.active ?? true);
  const [description, setDescription] = useState(existing?.description || '');

  const save = () => {
    if (!name.trim()) {
      addToast('Product name is required', 'error');
      return;
    }
    upsertProduct({
      id: existing?.id || Math.random().toString(36).slice(2, 9),
      name: name.trim(),
      category: category as any,
      pricingType: pricingType as any,
      price: parseFloat(price || '0'),
      active,
      description: description.trim(),
    });
    addToast('Product saved');
    navigate('/admin/products');
  };

  return (
    <div className="page">
      <div className="card form-card">
        <h2>{existing ? 'Edit Product' : 'Add Product'}</h2>
        <div className="form-grid">
          <div className="form-group">
            <label>Item name *</label>
            <input value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)}>
              <option value="Homemade">Homemade</option>
              <option value="Groceries">Groceries</option>
              <option value="Raw Meat">Raw Meat</option>
            </select>
          </div>
          <div className="form-group">
            <label>Pricing type</label>
            <select value={pricingType} onChange={e => setPricingType(e.target.value)}>
              <option value="FIXED">Fixed price</option>
              <option value="PER_LB">Price per lb</option>
            </select>
          </div>
          <div className="form-group">
            <label>{pricingType === 'PER_LB' ? 'Price per lb' : 'Price'}</label>
            <input value={price} onChange={e => setPrice(e.target.value)} />
          </div>
          <div className="form-group full-width">
            <label>Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <label className="checkbox">
            <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} />
            Active
          </label>
        </div>
        <div className="action-row">
          <button className="btn-secondary" onClick={() => navigate('/admin/products')}>Cancel</button>
          <button className="btn-primary" onClick={save}>Save Product</button>
        </div>
      </div>
    </div>
  );
};

export default ProductForm;
