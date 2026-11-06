import { describe, expect, it } from 'vitest';
import type { RequestStatus } from '../../src/config/constants';
import {
  REQUEST_TRANSITIONS,
  assertTransition,
  isTransitionAllowed,
} from '../../src/shared/state-machines/request.sm';

describe('Request state machine', () => {
  it('allows every transition in the specification for each listed actor', () => {
    expect(REQUEST_TRANSITIONS.length).toBeGreaterThan(0);

    for (const rule of REQUEST_TRANSITIONS) {
      for (const actor of rule.actors) {
        expect(() => assertTransition(rule.from, rule.to, actor)).not.toThrow();
        expect(isTransitionAllowed(rule.from, rule.to, actor)).toBe(true);
      }
    }
  });

  it('allows requested transitions only through a permitted actor', () => {
    expect(() => assertTransition('SUBMITTED', 'UNDER_REVIEW', 'MAINTENANCE_MANAGER')).not.toThrow();
    expect(() => assertTransition('UNDER_REVIEW', 'APPROVED', 'MAINTENANCE_MANAGER')).not.toThrow();
    expect(() => assertTransition('UNDER_REVIEW', 'REJECTED', 'MAINTENANCE_MANAGER')).not.toThrow();
    expect(() => assertTransition('COMPLETED', 'CLOSED', 'OWNER')).not.toThrow();
    expect(() => assertTransition('COMPLETED', 'CLOSED', 'MAINTENANCE_MANAGER')).not.toThrow();
    expect(() => assertTransition('COMPLETED', 'REOPENED', 'OWNER')).not.toThrow();
    expect(() => assertTransition('REOPENED', 'CLOSED', 'MAINTENANCE_MANAGER')).not.toThrow();
  });

  it('refuses transitions that are absent from the table', () => {
    const forbidden: Array<[RequestStatus, RequestStatus]> = [
      ['SUBMITTED', 'COMPLETED'],
      ['SUBMITTED', 'CLOSED'],
      ['APPROVED', 'CLOSED'],
      ['IN_PROGRESS', 'APPROVED'],
      ['COMPLETED', 'IN_PROGRESS'],
      ['CLOSED', 'REOPENED'],
      ['REJECTED', 'UNDER_REVIEW'],
      ['REOPENED', 'APPROVED'],
    ];

    for (const [from, to] of forbidden) {
      for (const actor of ['OWNER', 'MAINTENANCE_MANAGER', 'SYSTEM'] as const) {
        expect(isTransitionAllowed(from, to, actor)).toBe(false);
        expect(() => assertTransition(from, to, actor)).toThrowError(/cannot change/i);
      }
    }
  });

  it('refuses a valid transition performed by the wrong actor', () => {
    const forbiddenActors = [
      ['SUBMITTED', 'APPROVED', 'OWNER'],
      ['SUBMITTED', 'APPROVED', 'SUPER_ADMIN'],
      ['SUBMITTED', 'UNDER_REVIEW', 'STUDENT_EMPLOYEE'],
      ['APPROVED', 'IN_PROGRESS', 'MAINTENANCE_MANAGER'],
      ['IN_PROGRESS', 'COMPLETED', 'MAINTENANCE_MANAGER'],
      ['COMPLETED', 'CLOSED', 'SUPER_ADMIN'],
      ['REOPENED', 'CLOSED', 'OWNER'],
    ] as const;

    for (const [from, to, actor] of forbiddenActors) {
      expect(() => assertTransition(from, to, actor)).toThrowError(/cannot change/i);
    }
  });

  it('uses a 409 conflict error for illegal transitions', () => {
    try {
      assertTransition('SUBMITTED', 'COMPLETED', 'SYSTEM');
      throw new Error('Expected assertTransition to throw');
    } catch (error) {
      expect(error).toMatchObject({ statusCode: 409, code: 'CONFLICT' });
    }
  });
});
