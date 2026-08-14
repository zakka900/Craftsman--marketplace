import { useEffect, useState } from 'react';
import type { Dispute } from '../api';
import { listDisputes, resolveDispute } from '../api';

export default function Disputes() {
  const [disputes, setDisputes] = useState<Dispute[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<{ id: string; resolution: 'CLIENT' | 'ARTISAN' } | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const load = () => {
    setError(null);
    listDisputes()
      .then(setDisputes)
      .catch(() => setError('Could not load disputes.'));
  };

  useEffect(load, []);

  const confirmResolve = async () => {
    if (!pendingConfirm) return;
    const { id, resolution } = pendingConfirm;
    setResolvingId(id);
    setPendingConfirm(null);
    try {
      await resolveDispute(id, resolution);
      setDisputes((prev) => (prev ?? []).filter((d) => d.id !== id));
    } catch {
      setError('Resolution failed — please try again.');
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Open disputes</h1>
        <button className="btn-ghost" onClick={load}>Refresh</button>
      </div>

      {error && <div className="error-box">{error}</div>}

      {disputes === null && !error && <p className="muted">Loading…</p>}

      {disputes?.length === 0 && (
        <div className="empty-state">
          <p>No open disputes right now.</p>
        </div>
      )}

      <div className="dispute-list">
        {disputes?.map((d) => {
          const payment = d.request.contract?.payment;
          return (
            <div key={d.id} className="dispute-card">
              <div className="dispute-head">
                <span className={`badge badge-${d.status === 'OPEN' ? 'warn' : 'info'}`}>{d.status}</span>
                <span className="muted">{new Date(d.createdAt).toLocaleString()}</span>
              </div>

              <h3>{d.reason}</h3>
              <p>{d.description}</p>

              <div className="dispute-meta">
                <div>
                  <span className="muted">Client</span>
                  <div>{d.client.firstName} {d.client.lastName} · {d.client.email}</div>
                </div>
                <div>
                  <span className="muted">Artisan</span>
                  <div>{d.request.contract?.artisan?.name ?? '—'}</div>
                </div>
                <div>
                  <span className="muted">Request</span>
                  <div>{d.request.categoryId} — {d.request.description.slice(0, 80)}</div>
                </div>
                <div>
                  <span className="muted">Payment</span>
                  <div>{payment ? payment.status : 'none'}</div>
                </div>
              </div>

              {d.photos.length > 0 && (
                <div className="photo-row">
                  {d.photos.map((p, i) => <img key={i} src={p} alt="" />)}
                </div>
              )}

              {pendingConfirm?.id === d.id ? (
                <div className="confirm-row">
                  <span>Confirm resolution in favor of the {pendingConfirm.resolution === 'CLIENT' ? 'client' : 'artisan'}?</span>
                  <button className="btn-primary" onClick={confirmResolve}>Confirm</button>
                  <button className="btn-ghost" onClick={() => setPendingConfirm(null)}>Cancel</button>
                </div>
              ) : (
                <div className="dispute-actions">
                  <button
                    className="btn-outline"
                    disabled={resolvingId === d.id}
                    onClick={() => setPendingConfirm({ id: d.id, resolution: 'CLIENT' })}
                  >
                    Resolve for the client
                  </button>
                  <button
                    className="btn-outline"
                    disabled={resolvingId === d.id}
                    onClick={() => setPendingConfirm({ id: d.id, resolution: 'ARTISAN' })}
                  >
                    Resolve for the artisan
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
