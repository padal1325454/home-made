import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../state/AppState';

const CustomerForm = () => {
  const { customerId } = useParams();
  const { customers, upsertCustomer, addToast } = useApp();
  const navigate = useNavigate();
  const existing = useMemo(() => customers.find(c => c.id === customerId), [customers, customerId]);

  const [name, setName] = useState(existing?.name || '');
  const [phone, setPhone] = useState(existing?.phone || '');
  const [email, setEmail] = useState(existing?.email || '');
  const [address, setAddress] = useState(existing?.address || '');
  const [dateOfBirth, setDateOfBirth] = useState(existing?.dateOfBirth || '');
  const [notes, setNotes] = useState(existing?.notes || '');

  const save = () => {
    if (!name.trim() || !phone.trim()) {
      addToast('Name and phone are required', 'error');
      return;
    }
    upsertCustomer({
      id: existing?.id || Math.random().toString(36).slice(2, 9),
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      dateOfBirth: dateOfBirth.trim(),
      notes: notes.trim(),
    });
    addToast('Customer saved');
    navigate('/admin/customers');
  };

  return (
    <div className="page">
      <div className="card form-card">
        <h2>{existing ? 'Edit Customer' : 'Add Customer'}</h2>
        <div className="form-grid">
          <div className="form-group">
            <label>Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Phone *</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Address</label>
            <input value={address} onChange={e => setAddress(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Date of Birth</label>
            <input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} />
          </div>
          <div className="form-group full-width">
            <label>Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>
        <div className="action-row">
          <button className="btn-secondary" onClick={() => navigate('/admin/customers')}>Cancel</button>
          <button className="btn-primary" onClick={save}>Save Customer</button>
        </div>
      </div>
    </div>
  );
};

export default CustomerForm;
