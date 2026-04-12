import { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import './AuthPage.css';

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token    = params.get('token');
  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const [message, setMessage] = useState('');
  const { setUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) { setStatus('error'); setMessage('Invalid verification link.'); return; }
    api.get(`/auth/verify-email?token=${token}`)
      .then(res => {
        setUser(res.data.user);
        setStatus('success');
        setTimeout(() => navigate('/dashboard'), 2000);
      })
      .catch(err => {
        setStatus('error');
        setMessage(err.response?.data?.error || 'Verification failed');
      });
  }, [token]);

  return (
    <div className="auth-page landing-hero-bg">
      <div className="auth-card slide-up" style={{ textAlign: 'center' }}>
        {status === 'verifying' && (
          <>
            <div className="spinner spinner-lg" style={{ margin: '0 auto 20px' }} />
            <h2 className="auth-title">Verifying your email...</h2>
          </>
        )}
        {status === 'success' && (
          <>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>✅</div>
            <h2 className="auth-title">Email verified!</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>Redirecting you to your dashboard...</p>
            <div className="spinner" style={{ margin: '0 auto' }} />
          </>
        )}
        {status === 'error' && (
          <>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>❌</div>
            <h2 className="auth-title">Verification failed</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>{message}</p>
            <Link to="/login" className="btn btn-primary btn-full">Go to Login</Link>
          </>
        )}
      </div>
    </div>
  );
}
