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
      .catch(() => setError('Could not load artisans.'));
  }, [page, search]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <>
      <div className="page-header">
        <h1>Artisans</h1>
      </div>

      <div className="toolbar">
        <input
          placeholder="Search by name or city…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {error && <div className="error-box">{error}</div>}

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>City</th>
              <th>Country</th>
              <th>Verified</th>
              <th>Rating</th>
              <th>Jobs completed</th>
              <th>Contracts</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((a) => (
              <tr key={a.id}>
                <td>{a.name}</td>
                <td>{a.categoryId}</td>
                <td>{a.city}</td>
                <td>{a.country}</td>
                <td>{a.verified ? 'Yes' : 'No'}</td>
                <td>{a.rating.toFixed(1)}</td>
                <td>{a.jobsDone}</td>
                <td>{a._count.contracts}</td>
              </tr>
            ))}
            {data && data.items.length === 0 && (
              <tr><td colSpan={8} className="muted">No artisans found.</td></tr>
            )}
          </tbody>
        </table>
        {data && data.total > data.pageSize && (
          <div className="pagination">
            <button className="btn-ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Previous</button>
            <span>Page {page} of {totalPages}</span>
            <button className="btn-ghost" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next →</button>
          </div>
        )}
      </div>
    </>
  );
}
