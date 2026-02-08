import { useState } from 'react';
import { useApp } from '../state/AppState';
import Badge from '../components/ui/Badge';
import Pagination from '../components/ui/Pagination';
import Modal from '../components/ui/Modal';
import { Role, User } from '../types';

const UsersList = () => {
  const { users, upsertUser, addToast } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('Employee');
  const [active, setActive] = useState(true);

  const openModal = (user?: User) => {
    setEditing(user || null);
    setName(user?.name || '');
    setUsername(user?.username || '');
    setPassword(user?.password || '');
    setRole(user?.role || 'Employee');
    setActive(user?.active ?? true);
    setShowModal(true);
  };

  const save = () => {
    if (!name.trim() || !username.trim()) {
      addToast('Name and username are required', 'error');
      return;
    }
    upsertUser({
      id: editing?.id || Math.random().toString(36).slice(2, 9),
      name: name.trim(),
      username: username.trim(),
      password: password || 'temp123',
      role,
      active,
    });
    addToast('User saved');
    setShowModal(false);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Users</h2>
          <p className="text-secondary">Manage supervisors and employees.</p>
        </div>
        <button className="btn-primary" onClick={() => openModal()}>Add User</button>
      </div>
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Username</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.username}</td>
                <td>{user.role}</td>
                <td>
                  <Badge variant={user.active ? 'success' : 'warning'}>
                    {user.active ? 'Active' : 'Disabled'}
                  </Badge>
                </td>
                <td>
                  <button className="link-btn" onClick={() => openModal(user)}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination />
      </div>
      <Modal
        open={showModal}
        title={editing ? 'Edit User' : 'Add User'}
        onClose={() => setShowModal(false)}
        footer={
          <div className="modal-actions">
            <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={save}>Save User</button>
          </div>
        }
      >
        <div className="form-group">
          <label>Name</label>
          <input value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Username</label>
          <input value={username} onChange={e => setUsername(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Temp Password</label>
          <input value={password} onChange={e => setPassword(e.target.value)} placeholder="temp123" />
        </div>
        <div className="form-group">
          <label>Role</label>
          <select value={role} onChange={e => setRole(e.target.value as Role)}>
            <option value="Supervisor">Supervisor</option>
            <option value="Employee">Employee</option>
            <option value="Admin">Admin</option>
          </select>
        </div>
        <label className="checkbox">
          <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} />
          Active
        </label>
      </Modal>
    </div>
  );
};

export default UsersList;
