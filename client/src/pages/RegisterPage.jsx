import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import './AuthPage.css';

export default function RegisterPage() {
  const [form, setForm]       = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);
  const navigate = useNavigate();

  const validate = () => {
    if (!form.name.trim())      return 'Name is required';
    if (form.name.length < 2)   return 'Name too short';
    if (!form.email)            return 'Email is required';
    if (!/\S+@\S+\.\S+/.test(form.email)) return 'Invalid email format';
    if (form.password.length < 8) return 'Password must be at least 8 characters';
    if (form.password !== form.confirm) return 'Passwords do not match';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { toast.error(err); return; }
    setLoading(true);
    try {
      const res = await api.post('/auth/register', {
        name: form.name.trim(), email: form.email, password: form.password
      });
      toast.success(res.data.message);
      setDone(true);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="auth-page landing-hero-bg">
        <div className="auth-card slide-up" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>📬</div>
          <h2 className="auth-title">Check your email!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
            We sent a verification link to <strong style={{ color: 'var(--text-primary)' }}>{form.email}</strong>.
            Click the link to activate your account.
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Didn't get it? Check your spam folder or&nbsp;
            <Link to="/login">go to login</Link> to resend.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page landing-hero-bg">
      <div className="auth-card slide-up">
        <div className="auth-logo">
          <div className="sidebar-logo-icon" style={{ width: 44, height: 44, fontSize: 22, borderRadius: 10 }}>💰</div>
          <span style={{ fontSize: '1.3rem', fontWeight: 800 }}>SpendWise</span>
        </div>
        <h2 className="auth-title">Create account</h2>
        <p className="auth-sub">Start tracking your expenses today</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input id="reg-name" type="text" className="form-input" placeholder="John Doe" required
              value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input id="reg-email" type="email" className="form-input" placeholder="you@example.com" required
              value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input id="reg-password" type="password" className="form-input" placeholder="Min. 8 characters" required
              value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input id="reg-confirm" type="password" className="form-input" placeholder="Repeat password" required
              value={form.confirm} onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))} />
          </div>
          <button id="reg-submit" type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? <span className="spinner" /> : '🚀 Create Account'}
          </button>
        </form>

        <div className="divider">or</div>

        <a href="http://localhost:3001/api/auth/google" className="btn btn-secondary btn-full" id="google-register">
          <img src="https://www.google.com/favicon.ico" width={16} height={16} alt="" />
          Sign up with Google
        </a>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
