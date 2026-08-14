import { useEffect, useState } from 'react';
import { listUsers } from '../api';
import type { ClientRow, Page } from '../api';

export default function Users() {
  const [data, setData] = useState<Page<ClientRow> | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listUsers(page, search || undefined)
      .then(setData)
      .catch(() => setError('Impossibile caricare gli utenti.'));
  }, [page, search]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <>
      <div className="page-header">
        <h1>Utenti</h1>
      </div>

      <div className="toolbar">
        <input
          placeholder="Cerca per nome o email…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {error && <div className="error-box">{error}</div>}

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Paese</th>
              <th>Email verificata</th>
              <th>Banca verificata</th>
              <th>Richieste</th>
              <th>Registrato il</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((u) => (
              <tr key={u.id}>
                <td>{u.firstName} {u.lastName}</td>
                <td>{u.email}</td>
                <td>{u.country}</td>
                <td>{u.emailVerified ? 'Sì' : 'No'}</td>
                <td>{u.bankVerified ? 'Sì' : 'No'}</td>
                <td>{u._count.requests}</td>
                <td>{new Date(u.createdAt).toLocaleDateString('it-IT')}</td>
              </tr>
            ))}
            {data && data.items.length === 0 && (
              <tr><td colSpan={7} className="muted">Nessun utente trovato.</td></tr>
            )}
          </tbody>
        </table>
        {data && data.total > data.pageSize && (
          <div className="pagination">
            <button className="btn-ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Precedente</button>
            <span>Pagina {page} di {totalPages}</span>
            <button className="btn-ghost" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Successiva →</button>
          </div>
        )}
      </div>
    </>
  );
}
