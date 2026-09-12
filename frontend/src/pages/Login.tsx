import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('Password@123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function submit(event: FormEvent) {
    event.preventDefault(); setError(''); setLoading(true);
    try { await login(email, password); const stored = JSON.parse(localStorage.getItem('user') || '{}'); navigate(stored.role === 'CUSTOMER' ? '/orders' : '/dashboard'); }
    catch (err: any) { setError(err.response?.data?.message || 'Login failed'); }
    finally { setLoading(false); }
  }

  return <div className="login">
    <div className="login-card">
      <p className="eyebrow">NEXUS COMMERCE</p>
      <h1>Welcome back.</h1>
      <p className="muted">Sign in to manage orders, inventory and sales.</p>
      <form onSubmit={submit}>
        <label>Email<input required type="email" value={email} onChange={e=>setEmail(e.target.value)}/></label>
        <label>Password<input required minLength={1} type="password" value={password} onChange={e=>setPassword(e.target.value)}/></label>
        {error && <div className="error">{error}</div>}
        <button className="primary" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
      </form>
      <small>Demo accounts: admin@example.com · vendor1@example.com · customer1@example.com<br/>Password: Password@123</small>
    </div>
  </div>;
}
