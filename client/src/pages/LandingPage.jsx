import { Link } from 'react-router-dom';
import './LandingPage.css';

const features = [
  { icon: '📊', title: 'Rich Analytics', desc: 'Pie charts, trends, and monthly breakdowns to understand your spending patterns.' },
  { icon: '🗂️', title: 'Smart Categories', desc: 'Travel, Food, Bills, Investments, and more. Create custom categories too.' },
  { icon: '📤', title: 'Export Anywhere', desc: 'Export your expenses as CSV or Excel with powerful filters applied.' },
  { icon: '💱', title: 'Multi-Currency', desc: '20+ currencies supported. Default is INR. Switch anytime from settings.' },
  { icon: '🔔', title: 'Budget Alerts', desc: 'Set per-category budgets and get warned when you\'re close to the limit.' },
  { icon: '🔒', title: 'Secure & Private', desc: 'Email verified accounts, JWT auth, and Google Sign-In — your data stays yours.' },
];

export default function LandingPage() {
  return (
    <div className="landing-page landing-hero-bg">
      {/* ── Nav ── */}
      <nav className="landing-nav">
        <div className="landing-logo">
          <span className="landing-logo-icon">💰</span>
          <span>SpendWise</span>
        </div>
        <div className="landing-nav-actions">
          <Link to="/login" className="btn btn-ghost btn-sm">Sign In</Link>
          <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="landing-hero">
        <div className="hero-badge">✨ Smart Expense Tracking</div>
        <h1 className="hero-title">
          Take control of<br />
          <span className="hero-gradient">your finances</span>
        </h1>
        <p className="hero-desc">
          Track every rupee, visualize spending patterns, set budgets, and export reports — all in one beautiful app.
        </p>
        <div className="hero-actions">
          <Link to="/register" className="btn btn-primary btn-lg">
            🚀 Start Tracking Free
          </Link>
          <Link to="/login" className="btn btn-secondary btn-lg">
            Sign In
          </Link>
        </div>
        {/* <p className="hero-note">No credit card required · Free forever</p> */}
      </section>

      {/* ── Features ── */}
      <section className="landing-features">
        <h2 className="section-title">Everything you need</h2>
        <p className="section-subtitle">Powerful features to manage your money smarter</p>
        <div className="features-grid">
          {features.map(f => (
            <div key={f.title} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="landing-cta">
        <div className="cta-card">
          <h2>Ready to take control?</h2>
          <p>Join thousands managing their expenses smarter with SpendWise.</p>
          <Link to="/register" className="btn btn-primary btn-lg">
            Create Your Free Account →
          </Link>
        </div>
      </section>

      <footer className="landing-footer">
        <span>© 2025 SpendWise · Built with ❤️</span>
      </footer>
    </div>
  );
}
