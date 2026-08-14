import { useEffect, useState } from 'react';
import { getStats } from '../api';
import type { Stats } from '../api';
import { statusLabel } from '../statusBadge';

export default function Overview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getStats().then(setStats).catch(() => setError('Could not load statistics.'));
  }, []);

  if (error) return <div className="error-box">{error}</div>;
  if (!stats) return <div className="empty-state">Loading…</div>;

  const statusEntries = Object.entries(stats.requestsByStatus);

  return (
    <>
      <div className="page-header">
        <h1>Overview</h1>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Registered users</div>
          <div className="stat-value">{stats.totalUsers}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Artisans</div>
          <div className="stat-value">{stats.totalArtisans}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total requests</div>
          <div className="stat-value">{stats.totalRequests}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Open disputes</div>
          <div className="stat-value">{stats.openDisputes}</div>
        </div>
      </div>

      <div className="detail-grid">
        <div className="panel">
          <h2>Requests by status</h2>
          {statusEntries.length === 0 ? (
            <div className="muted">No requests yet.</div>
          ) : (
            statusEntries.map(([status, count]) => (
              <div className="status-row" key={status}>
                <span>{statusLabel(status)}</span>
                <strong>{count}</strong>
              </div>
            ))
          )}
        </div>

        <div className="panel">
          <h2>Revenue (released payments)</h2>
          {stats.revenueByCurrency.length === 0 ? (
            <div className="muted">No revenue yet.</div>
          ) : (
            stats.revenueByCurrency.map((r) => (
              <div className="status-row" key={r.currency}>
                <span>{r.currency}</span>
                <strong>{r.total.toLocaleString()}</strong>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
