import { useSearchParams } from 'react-router-dom';
import './AuthPage.css';

export default function LoginPage() {
  const [params] = useSearchParams();
  const error = params.get('error');

  const googleAuthUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/google`;

  return (
    <div className="auth-page landing-hero-bg">
      <div className="auth-card slide-up">
        <div className="auth-logo">
          <div className="sidebar-logo-icon" style={{ width: 44, height: 44, fontSize: 22, borderRadius: 10 }}>💰</div>
          <span style={{ fontSize: '1.3rem', fontWeight: 800 }}>SpendWise</span>
        </div>
        <h2 className="auth-title">Welcome back</h2>
        <p className="auth-sub">Sign in to continue tracking your expenses</p>

        {error && (
          <div className="banner banner-danger" style={{ marginBottom: 20 }}>
            <span>⚠️</span>
            <span>Google sign-in failed. Please try again.</span>
          </div>
        )}

        <a
          href={googleAuthUrl}
          className="btn btn-secondary btn-full"
          id="google-login"
          style={{ justifyContent: 'center', gap: 12, padding: '14px 20px', fontSize: 15 }}
        >
          <img src="https://www.google.com/favicon.ico" width={18} height={18} alt="" />
          Continue with Google
        </a>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 24, lineHeight: 1.6 }}>
          By signing in, you agree to our terms of service.<br />
          Your Google account info is only used to identify you.
        </p>
      </div>
    </div>
  );
}
