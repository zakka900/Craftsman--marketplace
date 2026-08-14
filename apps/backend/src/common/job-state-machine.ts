/**
 * Explicit STATE MACHINE for RequestStatus (= "Job" in the data model: Request
 * is the central entity, related to Chat, Quote, Payment, Status History/RequestEvent).
 * No arbitrary state jumps: every transition goes through here, on the backend side.
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
  if (from === to) return; // idempotent (e.g. a second quote while already QUOTES_RECEIVED)
  if (!ALLOWED_TRANSITIONS[from]?.includes(to)) {
    throw new BadRequestException(`INVALID_TRANSITION: ${from} -> ${to}`);
  }
}

/** From ARTISAN_SELECTED onward (quote accepted), direct contact info in chat is unlocked. */
const CONTACTS_UNLOCKED_STATUSES = new Set<RequestStatus>([
  'ARTISAN_SELECTED', 'IN_PROGRESS', 'COMPLETED', 'DISPUTED'
]);
export function contactsUnlockedForStatus(status: RequestStatus | null | undefined): boolean {
  return !!status && CONTACTS_UNLOCKED_STATUSES.has(status);
}

/**
 * Prepares the Prisma operations (status update + RequestEvent) for a valid transition.
 * Must be run inside a $transaction together with the caller's other operations.
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
