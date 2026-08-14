import { useEffect, useState } from 'react';
import { listReviews } from '../api';
import type { Page, ReviewRow } from '../api';

export default function Reviews() {
  const [data, setData] = useState<Page<ReviewRow> | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listReviews(page).then(setData).catch(() => setError('Impossibile caricare le recensioni.'));
  }, [page]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <>
      <div className="page-header">
        <h1>Recensioni</h1>
      </div>

      {error && <div className="error-box">{error}</div>}

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Artigiano</th>
              <th>Voto</th>
              <th>Consiglia</th>
              <th>Commento</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((r) => (
              <tr key={r.id}>
                <td>{r.client.firstName} {r.client.lastName}</td>
                <td>{r.artisan.name}</td>
                <td>{r.rating} / 5</td>
                <td>{r.recommend ? 'Sì' : 'No'}</td>
                <td>{r.text ?? '—'}</td>
                <td>{new Date(r.createdAt).toLocaleDateString('it-IT')}</td>
              </tr>
            ))}
            {data && data.items.length === 0 && (
              <tr><td colSpan={6} className="muted">Nessuna recensione trovata.</td></tr>
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
