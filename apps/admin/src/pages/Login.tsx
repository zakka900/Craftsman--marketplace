import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError, login } from '../api';

export default function Login({ onLogin }: { onLogin: () => void }) {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
      onLogin();
      nav('/disputes', { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setError('Questo account non ha il ruolo ADMIN.');
      } else if (err instanceof ApiError && (err.status === 404 || err.status === 401)) {
        setError('Credenziali non valide.');
      } else {
        setError('Errore di connessione al backend.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={submit}>
        <div className="brand" style={{ justifyContent: 'center', marginBottom: 8 }}>
          <span className="brand-dot" />
          Artisan Marketplace
        </div>
        <p className="login-sub">Accesso amministratori — richiede ruolo ADMIN</p>

        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>

        {error && <div className="error-box">{error}</div>}

        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? 'Accesso in corso…' : 'Accedi'}
        </button>
      </form>
    </div>
  );
}
