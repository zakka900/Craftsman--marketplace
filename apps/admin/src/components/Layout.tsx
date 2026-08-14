import { NavLink, useNavigate } from 'react-router-dom';
import { clearToken } from '../api';

const NAV = [
  { to: '/overview', label: 'Overview', icon: '◧' },
  { to: '/users', label: 'Users', icon: '◍' },
  { to: '/artisans', label: 'Artisans', icon: '◆' },
  { to: '/requests', label: 'Requests', icon: '▤' },
  { to: '/payments', label: 'Payments', icon: '◈' },
  { to: '/reviews', label: 'Reviews', icon: '★' },
  { to: '/disputes', label: 'Disputes', icon: '⚑' }
];

export default function Layout({ children, onLogout }: { children: React.ReactNode; onLogout: () => void }) {
  const nav = useNavigate();

  const logout = () => {
    clearToken();
    onLogout();
    nav('/login', { replace: true });
  };

  return (
    <div className="app-shell-side">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-dot" />
          Artisan Marketplace
        </div>
        <nav className="side-nav">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => 'side-link' + (isActive ? ' active' : '')}
            >
              <span className="side-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button className="btn-ghost logout-btn" onClick={logout}>Log out</button>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}
