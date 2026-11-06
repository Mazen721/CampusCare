import { describe, expect, it } from 'vitest';
import type { WorkOrderStatus } from '../../src/config/constants';
import {
  assertWorkOrderTransition,
  isWorkOrderTransitionAllowed,
} from '../../src/shared/state-machines/workOrder.sm';

describe('Work Order state machine', () => {
  it.each([
    ['PENDING_ASSIGNMENT', 'ASSIGNED', 'MAINTENANCE_MANAGER'],
    ['ASSIGNED', 'ASSIGNED', 'MAINTENANCE_MANAGER'],
    ['ASSIGNED', 'IN_PROGRESS', 'TECHNICIAN'],
    ['IN_PROGRESS', 'COMPLETED', 'TECHNICIAN'],
    ['PENDING_ASSIGNMENT', 'CANCELLED', 'MAINTENANCE_MANAGER'],
    ['ASSIGNED', 'CANCELLED', 'MAINTENANCE_MANAGER'],
    ['IN_PROGRESS', 'CANCELLED', 'MAINTENANCE_MANAGER'],
    ['COMPLETED', 'ASSIGNED', 'SYSTEM'],
  ] as const)('allows %s → %s by %s', (from, to, actor) => {
    expect(isWorkOrderTransitionAllowed(from, to, actor)).toBe(true);
    expect(() => assertWorkOrderTransition(from, to, actor)).not.toThrow();
  });

  it('refuses transitions that are absent from the table', () => {
    const forbidden: Array<[WorkOrderStatus, WorkOrderStatus]> = [
      ['PENDING_ASSIGNMENT', 'IN_PROGRESS'],
      ['PENDING_ASSIGNMENT', 'COMPLETED'],
      ['ASSIGNED', 'COMPLETED'],
      ['IN_PROGRESS', 'ASSIGNED'],
      ['COMPLETED', 'CANCELLED'],
      ['COMPLETED', 'IN_PROGRESS'],
      ['CANCELLED', 'PENDING_ASSIGNMENT'],
      ['CANCELLED', 'ASSIGNED'],
      ['CANCELLED', 'IN_PROGRESS'],
      ['CANCELLED', 'COMPLETED'],
    ];

    for (const [from, to] of forbidden) {
      for (const actor of [
        'MAINTENANCE_MANAGER',
        'TECHNICIAN',
        'SYSTEM',
        'SUPER_ADMIN',
        'STUDENT_EMPLOYEE',
      ] as const) {
        expect(isWorkOrderTransitionAllowed(from, to, actor)).toBe(false);
        expect(() => assertWorkOrderTransition(from, to, actor)).toThrowError(
          /cannot change/i,
        );
      }
    }
  });

  it('refuses an otherwise valid transition when performed by the wrong actor', () => {
    const forbiddenActorAttempts = [
      ['PENDING_ASSIGNMENT', 'ASSIGNED', 'TECHNICIAN'],
      ['PENDING_ASSIGNMENT', 'ASSIGNED', 'SUPER_ADMIN'],
      ['PENDING_ASSIGNMENT', 'ASSIGNED', 'STUDENT_EMPLOYEE'],
      ['ASSIGNED', 'IN_PROGRESS', 'MAINTENANCE_MANAGER'],
      ['ASSIGNED', 'IN_PROGRESS', 'SUPER_ADMIN'],
      ['IN_PROGRESS', 'COMPLETED', 'MAINTENANCE_MANAGER'],
      ['IN_PROGRESS', 'COMPLETED', 'SUPER_ADMIN'],
      ['PENDING_ASSIGNMENT', 'CANCELLED', 'TECHNICIAN'],
      ['ASSIGNED', 'CANCELLED', 'TECHNICIAN'],
      ['IN_PROGRESS', 'CANCELLED', 'TECHNICIAN'],
      ['COMPLETED', 'ASSIGNED', 'MAINTENANCE_MANAGER'],
      ['COMPLETED', 'ASSIGNED', 'TECHNICIAN'],
    ] as const;

    for (const [from, to, actor] of forbiddenActorAttempts) {
      expect(isWorkOrderTransitionAllowed(from, to, actor)).toBe(false);
      expect(() => assertWorkOrderTransition(from, to, actor)).toThrowError(
        /cannot change/i,
      );
    }
  });

  it('throws a 409 CONFLICT ApiError on illegal transitions', () => {
    try {
      assertWorkOrderTransition('PENDING_ASSIGNMENT', 'COMPLETED', 'TECHNICIAN');
      throw new Error('Expected assertWorkOrderTransition to throw');
    } catch (error) {
      expect(error).toMatchObject({ statusCode: 409, code: 'CONFLICT' });
    }
  });
});
