const OK = new Set(['COMPLETED', 'RELEASED', 'RESOLVED_CLIENT', 'RESOLVED_ARTISAN', 'CLOSED']);
const DANGER = new Set(['CANCELLED', 'DISPUTED', 'FAILED', 'REFUNDED', 'OPEN']);
const WARN = new Set(['AWAITING_QUOTES', 'QUOTES_RECEIVED', 'ARTISAN_SELECTED', 'IN_PROGRESS', 'PENDING', 'HELD_ESCROW', 'UNDER_REVIEW']);

export function statusBadgeClass(status: string): string {
  if (OK.has(status)) return 'badge badge-ok';
  if (DANGER.has(status)) return 'badge badge-danger';
  if (WARN.has(status)) return 'badge badge-warn';
  return 'badge badge-info';
}

export function statusLabel(status: string): string {
  return status.replaceAll('_', ' ');
}
