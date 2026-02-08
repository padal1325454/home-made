import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../state/AppState';
import Modal from '../components/ui/Modal';

const Login = () => {
  const { login, addToast, upsertUser } = useApp();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showSignup, setShowSignup] = useState(false);
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = login(username.trim(), password);
    if (ok) {
      localStorage.removeItem('admin_auto_login_disabled');
      navigate('/admin');
    } else {
      addToast('Invalid username or password', 'error');
    }
  };

  const onDemoLogin = () => {
    const ok = login('admin', 'admin123');
    if (ok) {
      localStorage.removeItem('admin_auto_login_disabled');
      navigate('/admin');
    }
  };

  const onSignup = () => {
    if (!signupName.trim() || !signupEmail.trim() || !signupPassword) {
      addToast('Name, email, and password are required', 'error');
      return;
    }
    upsertUser({
      id: Math.random().toString(36).slice(2, 9),
      name: signupName.trim(),
      username: signupEmail.trim(),
      password: signupPassword,
      role: 'Employee',
      active: true,
    });
    const ok = login(signupEmail.trim(), signupPassword);
    if (ok) {
      localStorage.removeItem('admin_auto_login_disabled');
      navigate('/admin');
      setShowSignup(false);
      setSignupName('');
      setSignupEmail('');
      setSignupPassword('');
      addToast('Account created');
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-hero">
        <div className="auth-hero-overlay">
          <div className="auth-brand">
            <span className="auth-brand-icon">🍴</span>
            FoodOrder
          </div>
          <h1>Delicious food, delivered to your door</h1>
          <p>Order from the best restaurants in your city.</p>
        </div>
      </div>
      <div className="auth-panel">
        <div className="auth-header">
          <h2>Welcome back</h2>
          <p className="text-secondary">Sign in to your account to continue</p>
        </div>
        <div className="auth-card">
          <h3>Sign In</h3>
          <p className="text-secondary">Enter your credentials to access your account</p>
          <form onSubmit={onSubmit}>
            <div className="form-group">
              <label>Email or Username</label>
              <input value={username} onChange={e => setUsername(e.target.value)} placeholder="admin@demo.com" />
            </div>
            <div className="form-group">
              <div className="form-row">
                <label>Password</label>
                <button type="button" className="link-btn">Forgot password?</button>
              </div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <button type="submit" className="btn-primary btn-block">
              Sign In
            </button>
          </form>
          <div className="auth-divider">OR CONTINUE WITH</div>
          <div className="auth-social">
            <button className="btn-secondary btn-block">Continue with Google</button>
            <button className="btn-secondary btn-block">Continue with Apple</button>
            <button className="btn-secondary btn-block">Continue with Facebook</button>
            <button className="btn-secondary btn-block">Continue with Microsoft</button>
          </div>
          <div className="auth-footer">
            Don't have an account? <button type="button" className="link-btn" onClick={() => setShowSignup(true)}>Sign up</button>
          </div>
        </div>
        <div className="auth-demo">
          <button type="button" className="btn-secondary" onClick={onDemoLogin}>Demo Login</button>
          <div className="login-hint">
            Demo Accounts:
            <div>Admin: admin@demo.com / admin123</div>
            <div>Supervisor: supervisor@demo.com / super123</div>
            <div>Employee: employee@demo.com / emp123</div>
          </div>
        </div>
      </div>
      <Modal
        open={showSignup}
        title="Create account"
        onClose={() => setShowSignup(false)}
        footer={
          <div className="modal-actions">
            <button className="btn-secondary" onClick={() => setShowSignup(false)}>Cancel</button>
            <button className="btn-primary" onClick={onSignup}>Create account</button>
          </div>
        }
      >
        <div className="form-group">
          <label>Full name</label>
          <input value={signupName} onChange={e => setSignupName(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input value={signupEmail} onChange={e => setSignupEmail(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" value={signupPassword} onChange={e => setSignupPassword(e.target.value)} />
        </div>
        <p className="text-secondary">New accounts are created as Employee by default.</p>
      </Modal>
    </div>
  );
};

export default Login;
