import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/dashboard',  icon: '🏠', label: 'Dashboard'  },
  { to: '/expenses',   icon: '💸', label: 'Expenses'   },
  { to: '/analytics',  icon: '📊', label: 'Analytics'  },
  { to: '/settings',   icon: '⚙️', label: 'Settings'   },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">💰</div>
        <span>SpendWise</span>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Menu</div>
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <span className="nav-item-icon">{item.icon}</span>
            <span className="nav-item-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
