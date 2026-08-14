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
      .catch(() => setError('Could not load users.'));
  }, [page, search]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <>
      <div className="page-header">
        <h1>Users</h1>
      </div>

      <div className="toolbar">
        <input
          placeholder="Search by name or email…"
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
              <th>Email</th>
              <th>Country</th>
              <th>Email verified</th>
              <th>Bank verified</th>
              <th>Requests</th>
              <th>Registered on</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((u) => (
              <tr key={u.id}>
                <td>{u.firstName} {u.lastName}</td>
                <td>{u.email}</td>
                <td>{u.country}</td>
                <td>{u.emailVerified ? 'Yes' : 'No'}</td>
                <td>{u.bankVerified ? 'Yes' : 'No'}</td>
                <td>{u._count.requests}</td>
                <td>{new Date(u.createdAt).toLocaleDateString('en-GB')}</td>
              </tr>
            ))}
            {data && data.items.length === 0 && (
              <tr><td colSpan={7} className="muted">No users found.</td></tr>
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
