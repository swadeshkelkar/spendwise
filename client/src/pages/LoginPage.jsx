import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './AuthPage.css';

export default function LoginPage() {
  const [form, setForm]       = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [unverified, setUnverified] = useState(null);
  const { login }   = useAuth();
  const navigate    = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setUnverified(null);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      const data = err.response?.data;
      if (data?.code === 'EMAIL_NOT_VERIFIED') {
        setUnverified(data.email);
      } else {
        toast.error(data?.error || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: unverified }),
      });
      const data = await res.json();
      if (res.ok) toast.success(data.message);
      else toast.error(data.error);
    } catch { toast.error('Failed to resend'); }
  };

  return (
    <div className="auth-page landing-hero-bg">
      <div className="auth-card slide-up">
        <div className="auth-logo">
          <div className="sidebar-logo-icon" style={{ width: 44, height: 44, fontSize: 22, borderRadius: 10 }}>💰</div>
          <span style={{ fontSize: '1.3rem', fontWeight: 800 }}>SpendWise</span>
        </div>
        <h2 className="auth-title">Welcome back</h2>
        <p className="auth-sub">Sign in to your account</p>

        {unverified && (
          <div className="banner banner-warning" style={{ marginBottom: 16 }}>
            <span>⚠️</span>
            <div>
              Please verify your email.&nbsp;
              <button onClick={handleResend} style={{ textDecoration: 'underline', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 600 }}>
                Resend email
              </button>
            </div>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input id="login-email" type="email" className="form-input" placeholder="you@example.com" required
              value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input id="login-password" type="password" className="form-input" placeholder="••••••••" required
              value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
          </div>
          <button id="login-submit" type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? <span className="spinner" /> : '🔓 Sign In'}
          </button>
        </form>

        <div className="divider">or</div>

        <a href="http://localhost:3001/api/auth/google" className="btn btn-secondary btn-full" id="google-login">
          <img src="https://www.google.com/favicon.ico" width={16} height={16} alt="" />
          Continue with Google
        </a>

        <p className="auth-footer">
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}
