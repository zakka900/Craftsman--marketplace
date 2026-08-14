import { useNavigate } from 'react-router-dom';
import { clearToken } from '../api';

export default function Layout({ children, onLogout }: { children: React.ReactNode; onLogout: () => void }) {
  const nav = useNavigate();

  const logout = () => {
    clearToken();
    onLogout();
    nav('/login', { replace: true });
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-dot" />
          Artisan Marketplace <span className="brand-sub">— Admin</span>
        </div>
        <button className="btn-ghost" onClick={logout}>Log out</button>
      </header>
      <main className="content">{children}</main>
    </div>
  );
}
