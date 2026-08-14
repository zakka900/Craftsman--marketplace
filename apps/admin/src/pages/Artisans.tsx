import { useEffect, useState } from 'react';
import { listArtisans } from '../api';
import type { ArtisanRow, Page } from '../api';

export default function Artisans() {
  const [data, setData] = useState<Page<ArtisanRow> | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listArtisans(page, search || undefined)
      .then(setData)
      .catch(() => setError('Impossibile caricare gli artigiani.'));
  }, [page, search]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <>
      <div className="page-header">
        <h1>Artigiani</h1>
      </div>

      <div className="toolbar">
        <input
          placeholder="Cerca per nome o città…"
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
              <th>Categoria</th>
              <th>Città</th>
              <th>Paese</th>
              <th>Verificato</th>
              <th>Rating</th>
              <th>Lavori completati</th>
              <th>Contratti</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((a) => (
              <tr key={a.id}>
                <td>{a.name}</td>
                <td>{a.categoryId}</td>
                <td>{a.city}</td>
                <td>{a.country}</td>
                <td>{a.verified ? 'Sì' : 'No'}</td>
                <td>{a.rating.toFixed(1)}</td>
                <td>{a.jobsDone}</td>
                <td>{a._count.contracts}</td>
              </tr>
            ))}
            {data && data.items.length === 0 && (
              <tr><td colSpan={8} className="muted">Nessun artigiano trovato.</td></tr>
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
