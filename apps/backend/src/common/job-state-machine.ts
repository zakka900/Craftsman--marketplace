/**
 * STATE MACHINE esplicita per RequestStatus (= "Job" nel modello dati: la Request
 * è l'entità centrale con relazioni a Chat, Quote, Payment, Status History/RequestEvent).
 * Nessun salto di stato arbitrario: ogni transizione passa da qui, lato backend.
 *
 *   AWAITING_QUOTES → QUOTES_RECEIVED → ARTISAN_SELECTED → IN_PROGRESS → COMPLETED
 *                                                                      ↘ DISPUTED → COMPLETED | CANCELLED
 *   AWAITING_QUOTES | QUOTES_RECEIVED → CANCELLED
 */
import { BadRequestException } from '@nestjs/common';
import { Prisma, RequestStatus } from '@prisma/client';

const ALLOWED_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  AWAITING_QUOTES: ['QUOTES_RECEIVED', 'CANCELLED'],
  QUOTES_RECEIVED: ['QUOTES_RECEIVED', 'ARTISAN_SELECTED', 'CANCELLED'],
  ARTISAN_SELECTED: ['IN_PROGRESS'],
  IN_PROGRESS: ['COMPLETED', 'DISPUTED'],
  DISPUTED: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: []
};

export function assertTransition(from: RequestStatus, to: RequestStatus) {
  if (from === to) return; // idempotente (es. secondo preventivo mentre già QUOTES_RECEIVED)
  if (!ALLOWED_TRANSITIONS[from]?.includes(to)) {
    throw new BadRequestException(`INVALID_TRANSITION: ${from} -> ${to}`);
  }
}

/** Da ARTISAN_SELECTED in poi (preventivo accettato) i contatti diretti in chat sono sbloccati. */
const CONTACTS_UNLOCKED_STATUSES = new Set<RequestStatus>([
  'ARTISAN_SELECTED', 'IN_PROGRESS', 'COMPLETED', 'DISPUTED'
]);
export function contactsUnlockedForStatus(status: RequestStatus | null | undefined): boolean {
  return !!status && CONTACTS_UNLOCKED_STATUSES.has(status);
}

/**
 * Prepara le operazioni Prisma (update stato + RequestEvent) per una transizione valida.
 * Va eseguito dentro una $transaction insieme alle altre operazioni del chiamante.
 */
export function buildTransitionOps(
  prisma: { request: any; requestEvent: any },
  requestId: string,
  from: RequestStatus,
  to: RequestStatus,
  eventText: string,
  eventType: 'created' | 'quote' | 'info' | 'stage' | 'dispute' | 'review' = 'stage'
): Prisma.PrismaPromise<any>[] {
  assertTransition(from, to);
  const ops: Prisma.PrismaPromise<any>[] = [];
  if (from !== to) {
    ops.push(prisma.request.update({ where: { id: requestId }, data: { status: to } }));
  }
  ops.push(prisma.requestEvent.create({ data: { requestId, type: eventType, text: eventText } }));
  return ops;
}
