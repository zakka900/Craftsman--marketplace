import { BadRequestException } from '@nestjs/common';
import { assertTransition, buildTransitionOps, contactsUnlockedForStatus } from './job-state-machine';

describe('job-state-machine', () => {
  describe('assertTransition', () => {
    it('allows the happy path chain', () => {
      expect(() => assertTransition('AWAITING_QUOTES', 'QUOTES_RECEIVED')).not.toThrow();
      expect(() => assertTransition('QUOTES_RECEIVED', 'ARTISAN_SELECTED')).not.toThrow();
      expect(() => assertTransition('ARTISAN_SELECTED', 'IN_PROGRESS')).not.toThrow();
      expect(() => assertTransition('IN_PROGRESS', 'COMPLETED')).not.toThrow();
    });

    it('allows cancellation from early states', () => {
      expect(() => assertTransition('AWAITING_QUOTES', 'CANCELLED')).not.toThrow();
      expect(() => assertTransition('QUOTES_RECEIVED', 'CANCELLED')).not.toThrow();
    });

    it('allows a dispute to resolve either way', () => {
      expect(() => assertTransition('DISPUTED', 'COMPLETED')).not.toThrow();
      expect(() => assertTransition('DISPUTED', 'CANCELLED')).not.toThrow();
    });

    it('is idempotent for the same status', () => {
      expect(() => assertTransition('QUOTES_RECEIVED', 'QUOTES_RECEIVED')).not.toThrow();
    });

    it('rejects skipping stages', () => {
      expect(() => assertTransition('AWAITING_QUOTES', 'ARTISAN_SELECTED')).toThrow(BadRequestException);
      expect(() => assertTransition('AWAITING_QUOTES', 'IN_PROGRESS')).toThrow(BadRequestException);
      expect(() => assertTransition('AWAITING_QUOTES', 'COMPLETED')).toThrow(BadRequestException);
    });

    it('rejects going backwards', () => {
      expect(() => assertTransition('IN_PROGRESS', 'ARTISAN_SELECTED')).toThrow(BadRequestException);
      expect(() => assertTransition('COMPLETED', 'IN_PROGRESS')).toThrow(BadRequestException);
    });

    it('rejects any transition out of terminal states', () => {
      expect(() => assertTransition('COMPLETED', 'DISPUTED')).toThrow(BadRequestException);
      expect(() => assertTransition('CANCELLED', 'AWAITING_QUOTES')).toThrow(BadRequestException);
    });

    it('rejects cancelling a job already in progress', () => {
      expect(() => assertTransition('IN_PROGRESS', 'CANCELLED')).toThrow(BadRequestException);
    });
  });

  describe('buildTransitionOps', () => {
    const fakePrisma = () => ({
      request: { update: jest.fn().mockReturnValue('UPDATE_OP') },
      requestEvent: { create: jest.fn().mockReturnValue('EVENT_OP') }
    });

    it('includes a request update when the status actually changes', () => {
      const prisma = fakePrisma();
      const ops = buildTransitionOps(prisma as any, 'req-1', 'AWAITING_QUOTES', 'QUOTES_RECEIVED', 'New quote');
      expect(prisma.request.update).toHaveBeenCalledWith({
        where: { id: 'req-1' }, data: { status: 'QUOTES_RECEIVED' }
      });
      expect(ops).toEqual(['UPDATE_OP', 'EVENT_OP']);
    });

    it('skips the request update when the status is unchanged (idempotent call)', () => {
      const prisma = fakePrisma();
      const ops = buildTransitionOps(prisma as any, 'req-1', 'QUOTES_RECEIVED', 'QUOTES_RECEIVED', 'Another quote');
      expect(prisma.request.update).not.toHaveBeenCalled();
      expect(ops).toEqual(['EVENT_OP']);
    });

    it('throws before touching prisma when the transition is invalid', () => {
      const prisma = fakePrisma();
      expect(() => buildTransitionOps(prisma as any, 'req-1', 'COMPLETED', 'IN_PROGRESS', 'oops')).toThrow(BadRequestException);
      expect(prisma.request.update).not.toHaveBeenCalled();
      expect(prisma.requestEvent.create).not.toHaveBeenCalled();
    });
  });

  describe('contactsUnlockedForStatus', () => {
    it('is locked before a quote is accepted', () => {
      expect(contactsUnlockedForStatus('AWAITING_QUOTES')).toBe(false);
      expect(contactsUnlockedForStatus('QUOTES_RECEIVED')).toBe(false);
    });

    it('unlocks from ARTISAN_SELECTED onward', () => {
      expect(contactsUnlockedForStatus('ARTISAN_SELECTED')).toBe(true);
      expect(contactsUnlockedForStatus('IN_PROGRESS')).toBe(true);
      expect(contactsUnlockedForStatus('COMPLETED')).toBe(true);
      expect(contactsUnlockedForStatus('DISPUTED')).toBe(true);
    });

    it('is locked when there is no status at all', () => {
      expect(contactsUnlockedForStatus(null)).toBe(false);
      expect(contactsUnlockedForStatus(undefined)).toBe(false);
    });
  });
});
