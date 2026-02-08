import { useState } from 'react';
import { useApp } from '../state/AppState';

const Settings = () => {
  const { settings, updateSettings, addToast } = useApp();
  const [draft, setDraft] = useState(settings);

  const save = () => {
    updateSettings(draft);
    addToast('Settings saved');
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Settings</h2>
          <p className="text-secondary">Configure business and notification settings.</p>
        </div>
        <button className="btn-primary" onClick={save}>Save Changes</button>
      </div>
      <div className="settings-grid">
        <div className="card">
          <h3>Business</h3>
          <div className="form-group">
            <label>Business name</label>
            <input
              value={draft.businessName}
              onChange={e => setDraft({ ...draft, businessName: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Logo</label>
            <div className="image-placeholder">Logo placeholder</div>
          </div>
        </div>
        <div className="card">
          <h3>Tax & Fees</h3>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={draft.taxEnabled}
              onChange={e => setDraft({ ...draft, taxEnabled: e.target.checked })}
            />
            Enable tax
          </label>
          <div className="form-group">
            <label>Tax %</label>
            <input
              value={draft.taxPercent}
              onChange={e => setDraft({ ...draft, taxPercent: parseFloat(e.target.value || '0') })}
            />
          </div>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={draft.feesEnabled}
              onChange={e => setDraft({ ...draft, feesEnabled: e.target.checked })}
            />
            Enable fees
          </label>
          <div className="form-group">
            <label>Fee value</label>
            <input
              value={draft.feeValue}
              onChange={e => setDraft({ ...draft, feeValue: parseFloat(e.target.value || '0') })}
            />
          </div>
        </div>
        <div className="card full-width">
          <h3>Notification Templates</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Invoice Email</label>
              <textarea
                value={draft.templates.invoiceEmail}
                onChange={e => setDraft({ ...draft, templates: { ...draft.templates, invoiceEmail: e.target.value } })}
              />
            </div>
            <div className="form-group">
              <label>Invoice SMS</label>
              <textarea
                value={draft.templates.invoiceSms}
                onChange={e => setDraft({ ...draft, templates: { ...draft.templates, invoiceSms: e.target.value } })}
              />
            </div>
            <div className="form-group">
              <label>Receipt Email</label>
              <textarea
                value={draft.templates.receiptEmail}
                onChange={e => setDraft({ ...draft, templates: { ...draft.templates, receiptEmail: e.target.value } })}
              />
            </div>
            <div className="form-group">
              <label>Receipt SMS</label>
              <textarea
                value={draft.templates.receiptSms}
                onChange={e => setDraft({ ...draft, templates: { ...draft.templates, receiptSms: e.target.value } })}
              />
            </div>
            <div className="form-group">
              <label>Status Processing</label>
              <textarea
                value={draft.templates.statusProcessing}
                onChange={e => setDraft({ ...draft, templates: { ...draft.templates, statusProcessing: e.target.value } })}
              />
            </div>
            <div className="form-group">
              <label>Status Prepared</label>
              <textarea
                value={draft.templates.statusPrepared}
                onChange={e => setDraft({ ...draft, templates: { ...draft.templates, statusPrepared: e.target.value } })}
              />
            </div>
            <div className="form-group">
              <label>Status Delivered</label>
              <textarea
                value={draft.templates.statusDelivered}
                onChange={e => setDraft({ ...draft, templates: { ...draft.templates, statusDelivered: e.target.value } })}
              />
            </div>
          </div>
        </div>
        <div className="card">
          <h3>Role Permissions</h3>
          <ul className="role-list">
            <li><strong>Admin:</strong> Full access, templates, reports, settings, printing.</li>
            <li><strong>Supervisor:</strong> Users, inventory, customers, orders, limited settings.</li>
            <li><strong>Employee:</strong> Customers, orders, lifecycle updates, messages.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Settings;
