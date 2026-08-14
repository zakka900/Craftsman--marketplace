import { useEffect, useState } from 'react';
import { listPayments } from '../api';
import type { Page, PaymentRow } from '../api';
import { statusBadgeClass, statusLabel } from '../statusBadge';

const STATUSES = ['PENDING', 'HELD_ESCROW', 'RELEASED', 'REFUNDED', 'FAILED'];

export default function Payments() {
  const [data, setData] = useState<Page<PaymentRow> | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listPayments(page, status || undefined)
      .then(setData)
      .catch(() => setError('Impossibile caricare i pagamenti.'));
  }, [page, status]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <>
      <div className="page-header">
        <h1>Pagamenti</h1>
      </div>

      <div className="toolbar">
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">Tutti gli stati</option>
          {STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
        </select>
      </div>

      {error && <div className="error-box">{error}</div>}

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Artigiano</th>
              <th>Importo</th>
              <th>Metodo</th>
              <th>Stato</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((p) => (
              <tr key={p.id}>
                <td>{p.client.firstName} {p.client.lastName}</td>
                <td>{p.contract.artisan.name}</td>
                <td>{p.amount} {p.currency}</td>
                <td>{p.method}</td>
                <td><span className={statusBadgeClass(p.status)}>{statusLabel(p.status)}</span></td>
                <td>{new Date(p.createdAt).toLocaleDateString('it-IT')}</td>
              </tr>
            ))}
            {data && data.items.length === 0 && (
              <tr><td colSpan={6} className="muted">Nessun pagamento trovato.</td></tr>
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
