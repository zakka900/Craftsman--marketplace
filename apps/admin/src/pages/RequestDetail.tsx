import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getRequestDetail } from '../api';
import type { RequestDetail as RequestDetailType } from '../api';
import { statusBadgeClass, statusLabel } from '../statusBadge';

export default function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const [req, setReq] = useState<RequestDetailType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getRequestDetail(id).then(setReq).catch(() => setError('Could not load the request.'));
  }, [id]);

  if (error) return <div className="error-box">{error}</div>;
  if (!req) return <div className="empty-state">Loading…</div>;

  return (
    <>
      <div className="page-header">
        <div>
          <Link to="/requests" className="back-link">← Requests</Link>
          <h1 style={{ marginTop: 6 }}>{req.categoryId} / {req.subcategory}</h1>
        </div>
        <span className={statusBadgeClass(req.status)}>{statusLabel(req.status)}</span>
      </div>

      <div className="detail-grid">
        <div>
          <div className="panel">
            <h2>Description</h2>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>{req.description}</p>
            {req.photos.length > 0 && (
              <div className="photo-row" style={{ marginTop: 14, marginBottom: 0 }}>
                {req.photos.map((p, i) => <img key={i} src={p} alt="" />)}
              </div>
            )}
          </div>

          <div className="panel">
            <h2>Quotes ({req.quotes.length})</h2>
            {req.quotes.length === 0 ? <div className="muted">No quotes yet.</div> : (
              <div className="table-wrap" style={{ boxShadow: 'none' }}>
                <table className="data-table">
                  <thead>
                    <tr><th>Artisan</th><th>Price</th><th>Labor</th><th>Materials</th><th>Days</th><th>Recommended</th></tr>
                  </thead>
                  <tbody>
                    {req.quotes.map((q) => (
                      <tr key={q.id}>
                        <td>{q.artisan.name} ({q.artisan.city})</td>
                        <td>{q.price}</td>
                        <td>{q.laborCost}</td>
                        <td>{q.materials}</td>
                        <td>{q.days}</td>
                        <td>{q.recommended ? '★' : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {req.infoRequests.length > 0 && (
            <div className="panel">
              <h2>Info requests</h2>
              {req.infoRequests.map((ir) => (
                <div key={ir.id} className="status-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
                  <strong style={{ fontSize: 13 }}>{ir.artisan.name}: {ir.question}</strong>
                  <span className="muted">{ir.replyText ?? 'Waiting for the client to reply'}</span>
                </div>
              ))}
            </div>
          )}

          <div className="panel">
            <h2>Timeline</h2>
            {req.events.length === 0 ? <div className="muted">No events recorded.</div> : (
              <div className="timeline">
                {req.events.map((e) => (
                  <div className="timeline-item" key={e.id}>
                    <div className="t-time">{new Date(e.createdAt).toLocaleString('en-GB')} — {e.type}</div>
                    {e.text}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="panel">
            <h2>Client</h2>
            <div className="kv-row"><span>Name</span><span>{req.client.firstName} {req.client.lastName}</span></div>
            <div className="kv-row"><span>Email</span><span>{req.client.email}</span></div>
            <div className="kv-row"><span>Phone</span><span>{req.client.phone ?? '—'}</span></div>
            <div className="kv-row"><span>Country</span><span>{req.client.country}</span></div>
            <div className="kv-row"><span>City</span><span>{req.city}</span></div>
            <div className="kv-row"><span>Urgency</span><span>{req.urgency}</span></div>
            <div className="kv-row"><span>Budget</span><span>{req.budgetMin ?? '—'} – {req.budgetMax ?? '—'}</span></div>
          </div>

          {req.contract && (
            <div className="panel">
              <h2>Contract</h2>
              <div className="kv-row"><span>Artisan</span><span>{req.contract.artisan.name}</span></div>
              <div className="kv-row"><span>Price</span><span>{req.contract.price} {req.contract.currency}</span></div>
              <div className="kv-row"><span>Duration</span><span>{req.contract.days} days</span></div>
              <div className="kv-row"><span>Signed</span><span>{req.contract.signedAt ? new Date(req.contract.signedAt).toLocaleDateString('en-GB') : 'No'}</span></div>
              {req.contract.payment && (
                <>
                  <div className="kv-row">
                    <span>Payment</span>
                    <span className={statusBadgeClass(req.contract.payment.status)}>{statusLabel(req.contract.payment.status)}</span>
                  </div>
                  <div className="kv-row"><span>Amount</span><span>{req.contract.payment.amount} {req.contract.payment.currency}</span></div>
                  <div className="kv-row"><span>Method</span><span>{req.contract.payment.method}</span></div>
                </>
              )}
            </div>
          )}

          {req.dispute && (
            <div className="panel">
              <h2>Dispute</h2>
              <div className="kv-row"><span>Status</span><span className={statusBadgeClass(req.dispute.status)}>{statusLabel(req.dispute.status)}</span></div>
              <div className="kv-row"><span>Reason</span><span>{req.dispute.reason}</span></div>
              <p style={{ fontSize: 13, marginTop: 10 }}>{req.dispute.description}</p>
            </div>
          )}

          {req.review && (
            <div className="panel">
              <h2>Review</h2>
              <div className="kv-row"><span>Rating</span><span>{req.review.rating} / 5</span></div>
              <div className="kv-row"><span>Quality</span><span>{req.review.quality} / 5</span></div>
              <div className="kv-row"><span>Punctuality</span><span>{req.review.punctuality} / 5</span></div>
              <div className="kv-row"><span>Cleanliness</span><span>{req.review.cleanliness} / 5</span></div>
              <div className="kv-row"><span>Communication</span><span>{req.review.communication} / 5</span></div>
              {req.review.text && <p style={{ fontSize: 13, marginTop: 10 }}>{req.review.text}</p>}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
