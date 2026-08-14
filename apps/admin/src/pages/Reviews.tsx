import { useEffect, useState } from 'react';
import { listReviews } from '../api';
import type { Page, ReviewRow } from '../api';

export default function Reviews() {
  const [data, setData] = useState<Page<ReviewRow> | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listReviews(page).then(setData).catch(() => setError('Could not load reviews.'));
  }, [page]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <>
      <div className="page-header">
        <h1>Reviews</h1>
      </div>

      {error && <div className="error-box">{error}</div>}

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Artisan</th>
              <th>Rating</th>
              <th>Recommends</th>
              <th>Comment</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((r) => (
              <tr key={r.id}>
                <td>{r.client.firstName} {r.client.lastName}</td>
                <td>{r.artisan.name}</td>
                <td>{r.rating} / 5</td>
                <td>{r.recommend ? 'Yes' : 'No'}</td>
                <td>{r.text ?? '—'}</td>
                <td>{new Date(r.createdAt).toLocaleDateString('en-GB')}</td>
              </tr>
            ))}
            {data && data.items.length === 0 && (
              <tr><td colSpan={6} className="muted">No reviews found.</td></tr>
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
