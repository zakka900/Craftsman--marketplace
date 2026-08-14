import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listRequests } from '../api';
import type { Page, RequestRow } from '../api';
import { statusBadgeClass, statusLabel } from '../statusBadge';

const STATUSES = ['AWAITING_QUOTES', 'QUOTES_RECEIVED', 'ARTISAN_SELECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DISPUTED'];

export default function Requests() {
  const nav = useNavigate();
  const [data, setData] = useState<Page<RequestRow> | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listRequests(page, status || undefined)
      .then(setData)
      .catch(() => setError('Could not load requests.'));
  }, [page, status]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <>
      <div className="page-header">
        <h1>Requests</h1>
      </div>

      <div className="toolbar">
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
        </select>
      </div>

      {error && <div className="error-box">{error}</div>}

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Category</th>
              <th>City</th>
              <th>Status</th>
              <th>Quotes</th>
              <th>Artisan</th>
              <th>Price</th>
              <th>Created on</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((r) => (
              <tr key={r.id} className="clickable" onClick={() => nav(`/requests/${r.id}`)}>
                <td>{r.client.firstName} {r.client.lastName}</td>
                <td>{r.categoryId} / {r.subcategory}</td>
                <td>{r.city}</td>
                <td><span className={statusBadgeClass(r.status)}>{statusLabel(r.status)}</span></td>
                <td>{r._count.quotes}</td>
                <td>{r.contract?.artisan.name ?? '—'}</td>
                <td>{r.contract ? `${r.contract.price} ${r.contract.currency}` : '—'}</td>
                <td>{new Date(r.createdAt).toLocaleDateString('en-GB')}</td>
              </tr>
            ))}
            {data && data.items.length === 0 && (
              <tr><td colSpan={8} className="muted">No requests found.</td></tr>
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
