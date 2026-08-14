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
      .catch(() => setError('Impossibile caricare le dispute.'));
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
      setError('Risoluzione fallita — riprova.');
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Dispute aperte</h1>
        <button className="btn-ghost" onClick={load}>Aggiorna</button>
      </div>

      {error && <div className="error-box">{error}</div>}

      {disputes === null && !error && <p className="muted">Caricamento…</p>}

      {disputes?.length === 0 && (
        <div className="empty-state">
          <p>Nessuna disputa aperta al momento.</p>
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
                  <span className="muted">Cliente</span>
                  <div>{d.client.firstName} {d.client.lastName} · {d.client.email}</div>
                </div>
                <div>
                  <span className="muted">Artigiano</span>
                  <div>{d.request.contract?.artisan?.name ?? '—'}</div>
                </div>
                <div>
                  <span className="muted">Richiesta</span>
                  <div>{d.request.categoryId} — {d.request.description.slice(0, 80)}</div>
                </div>
                <div>
                  <span className="muted">Pagamento</span>
                  <div>{payment ? payment.status : 'nessuno'}</div>
                </div>
              </div>

              {d.photos.length > 0 && (
                <div className="photo-row">
                  {d.photos.map((p, i) => <img key={i} src={p} alt="" />)}
                </div>
              )}

              {pendingConfirm?.id === d.id ? (
                <div className="confirm-row">
                  <span>Confermi risoluzione a favore di {pendingConfirm.resolution === 'CLIENT' ? 'cliente' : 'artigiano'}?</span>
                  <button className="btn-primary" onClick={confirmResolve}>Conferma</button>
                  <button className="btn-ghost" onClick={() => setPendingConfirm(null)}>Annulla</button>
                </div>
              ) : (
                <div className="dispute-actions">
                  <button
                    className="btn-outline"
                    disabled={resolvingId === d.id}
                    onClick={() => setPendingConfirm({ id: d.id, resolution: 'CLIENT' })}
                  >
                    Risolvi per il cliente
                  </button>
                  <button
                    className="btn-outline"
                    disabled={resolvingId === d.id}
                    onClick={() => setPendingConfirm({ id: d.id, resolution: 'ARTISAN' })}
                  >
                    Risolvi per l'artigiano
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
