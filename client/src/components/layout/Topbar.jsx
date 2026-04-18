import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { getCurrencySymbol } from '../../utils/currency';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/expenses': 'Expenses',
  '/analytics': 'Analytics',
  '/settings': 'Settings',
};

export default function Topbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const title = PAGE_TITLES[location.pathname] || 'SpendWise';

  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfile(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const initials = user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <header className="topbar">
      <h1 className="topbar-title">{title}</h1>
      <div className="topbar-right">
        {user?.currency && (
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', background: 'var(--bg-tertiary)', padding: '4px 10px', borderRadius: 99, border: '1px solid var(--border)' }}>
            {getCurrencySymbol(user.currency)} {user.currency}
          </span>
        )}
        <div style={{ position: 'relative' }} className="dropdown" ref={profileRef}>
          <div className="topbar-avatar" title={user?.name} onClick={() => setShowProfile(v => !v)} style={{ cursor: 'pointer' }}>
            {user?.avatar_url
              ? <img src={user.avatar_url} alt={user.name} />
              : initials
            }
          </div>
          <div className={`dropdown-menu${showProfile ? ' open' : ''}`} style={{ minWidth: 200 }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-light)' }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{user?.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{user?.email}</div>
            </div>
            <button className="dropdown-item" onClick={() => { navigate('/settings'); setShowProfile(false); }}>⚙️ Settings</button>
            <button className="dropdown-item danger" onClick={handleLogout}>🚪 Sign Out</button>
          </div>
        </div>
      </div>
    </header>
  );
}
