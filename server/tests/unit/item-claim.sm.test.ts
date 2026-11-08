import { describe, expect, it } from 'vitest';
import type { ClaimStatus, ItemStatus } from '../../src/config/constants';
import {
  CLAIM_TRANSITIONS,
  assertClaimTransition,
  isClaimTransitionAllowed,
} from '../../src/shared/state-machines/claim.sm';
import {
  ITEM_TRANSITIONS,
  assertItemTransition,
  isItemTransitionAllowed,
  type ItemTransitionActor,
} from '../../src/shared/state-machines/item.sm';

describe('Item state machine (MASTER_SPEC 6.2)', () => {
  it('allows every transition in the table for each listed actor', () => {
    expect(ITEM_TRANSITIONS.length).toBeGreaterThan(0);

    for (const rule of ITEM_TRANSITIONS) {
      for (const actor of rule.actors) {
        expect(() => assertItemTransition(rule.from, rule.to, actor)).not.toThrow();
        expect(isItemTransitionAllowed(rule.from, rule.to, actor)).toBe(true);
      }
    }
  });

  it('allows the documented match, claim, handover and close transitions', () => {
    const allowed: Array<[ItemStatus, ItemStatus, ItemTransitionActor]> = [
      ['OPEN', 'MATCH_CONFIRMED', 'LOST_FOUND_OFFICER'],
      ['OPEN', 'CLAIM_UNDER_REVIEW', 'SYSTEM'],
      ['MATCH_CONFIRMED', 'CLAIM_UNDER_REVIEW', 'SYSTEM'],
      ['CLAIM_UNDER_REVIEW', 'APPROVED_FOR_HANDOVER', 'LOST_FOUND_OFFICER'],
      ['CLAIM_UNDER_REVIEW', 'OPEN', 'LOST_FOUND_OFFICER'],
      ['CLAIM_UNDER_REVIEW', 'OPEN', 'SYSTEM'],
      ['APPROVED_FOR_HANDOVER', 'RETURNED', 'LOST_FOUND_OFFICER'],
      ['APPROVED_FOR_HANDOVER', 'RETURNED', 'SYSTEM'],
      ['OPEN', 'RETURNED', 'SYSTEM'],
      ['MATCH_CONFIRMED', 'RETURNED', 'SYSTEM'],
      ['OPEN', 'CLOSED', 'LOST_FOUND_OFFICER'],
      ['OPEN', 'CLOSED', 'REPORTER'],
      ['MATCH_CONFIRMED', 'CLOSED', 'LOST_FOUND_OFFICER'],
      ['CLAIM_UNDER_REVIEW', 'CLOSED', 'LOST_FOUND_OFFICER'],
      ['APPROVED_FOR_HANDOVER', 'CLOSED', 'LOST_FOUND_OFFICER'],
    ];

    for (const [from, to, actor] of allowed) {
      expect(() => assertItemTransition(from, to, actor)).not.toThrow();
    }
  });

  it('refuses transitions that skip workflow steps', () => {
    const forbidden: Array<[ItemStatus, ItemStatus]> = [
      ['OPEN', 'APPROVED_FOR_HANDOVER'],
      ['OPEN', 'CLAIM_UNDER_REVIEW'],
      ['MATCH_CONFIRMED', 'APPROVED_FOR_HANDOVER'],
      ['CLAIM_UNDER_REVIEW', 'RETURNED'],
      ['RETURNED', 'OPEN'],
      ['RETURNED', 'CLOSED'],
      ['CLOSED', 'OPEN'],
      ['CLOSED', 'MATCH_CONFIRMED'],
    ];

    for (const [from, to] of forbidden) {
      expect(isItemTransitionAllowed(from, to, 'LOST_FOUND_OFFICER')).toBe(false);
      expect(() => assertItemTransition(from, to, 'LOST_FOUND_OFFICER')).toThrowError(
        /cannot change/i,
      );
    }
  });

  it('restricts the handover side effect on a linked lost item to SYSTEM', () => {
    expect(isItemTransitionAllowed('OPEN', 'RETURNED', 'LOST_FOUND_OFFICER')).toBe(false);
    expect(isItemTransitionAllowed('MATCH_CONFIRMED', 'RETURNED', 'REPORTER')).toBe(false);
    expect(isItemTransitionAllowed('OPEN', 'RETURNED', 'SYSTEM')).toBe(true);
    expect(isItemTransitionAllowed('MATCH_CONFIRMED', 'RETURNED', 'SYSTEM')).toBe(true);
  });

  it('uses a 409 conflict error for illegal item transitions', () => {
    try {
      assertItemTransition('OPEN', 'APPROVED_FOR_HANDOVER', 'LOST_FOUND_OFFICER');
      throw new Error('Expected assertItemTransition to throw');
    } catch (error) {
      expect(error).toMatchObject({ statusCode: 409, code: 'CONFLICT' });
    }
  });
});

describe('Claim state machine (MASTER_SPEC 6.4)', () => {
  it('allows every transition in the table for each listed actor', () => {
    expect(CLAIM_TRANSITIONS.length).toBeGreaterThan(0);

    for (const rule of CLAIM_TRANSITIONS) {
      for (const actor of rule.actors) {
        expect(() => assertClaimTransition(rule.from, rule.to, actor)).not.toThrow();
        expect(isClaimTransitionAllowed(rule.from, rule.to, actor)).toBe(true);
      }
    }
  });

  it('allows verification, approval, rejection and completion', () => {
    const allowed: Array<[ClaimStatus, ClaimStatus, 'LOST_FOUND_OFFICER' | 'SYSTEM']> = [
      ['PENDING_REVIEW', 'UNDER_VERIFICATION', 'LOST_FOUND_OFFICER'],
      ['UNDER_VERIFICATION', 'APPROVED', 'LOST_FOUND_OFFICER'],
      ['PENDING_REVIEW', 'REJECTED', 'LOST_FOUND_OFFICER'],
      ['UNDER_VERIFICATION', 'REJECTED', 'LOST_FOUND_OFFICER'],
      ['PENDING_REVIEW', 'REJECTED', 'SYSTEM'],
      ['UNDER_VERIFICATION', 'REJECTED', 'SYSTEM'],
      ['APPROVED', 'COMPLETED', 'LOST_FOUND_OFFICER'],
    ];

    for (const [from, to, actor] of allowed) {
      expect(() => assertClaimTransition(from, to, actor)).not.toThrow();
    }
  });

  it('refuses transitions that skip verification or reopen terminal claims', () => {
    const forbidden: Array<[ClaimStatus, ClaimStatus]> = [
      ['PENDING_REVIEW', 'APPROVED'],
      ['PENDING_REVIEW', 'COMPLETED'],
      ['APPROVED', 'REJECTED'],
      ['COMPLETED', 'APPROVED'],
      ['REJECTED', 'UNDER_VERIFICATION'],
      ['REJECTED', 'APPROVED'],
      ['UNDER_VERIFICATION', 'COMPLETED'],
    ];

    for (const [from, to] of forbidden) {
      expect(isClaimTransitionAllowed(from, to, 'LOST_FOUND_OFFICER')).toBe(false);
      expect(() => assertClaimTransition(from, to, 'LOST_FOUND_OFFICER')).toThrowError(
        /cannot change/i,
      );
    }
  });

  it('restricts actors for sensitive transitions', () => {
    expect(isClaimTransitionAllowed('APPROVED', 'COMPLETED', 'SYSTEM')).toBe(false);
    expect(isClaimTransitionAllowed('UNDER_VERIFICATION', 'APPROVED', 'SYSTEM')).toBe(false);
    expect(isClaimTransitionAllowed('PENDING_REVIEW', 'UNDER_VERIFICATION', 'SYSTEM')).toBe(
      false,
    );
  });

  it('uses a 409 conflict error for illegal claim transitions', () => {
    try {
      assertClaimTransition('PENDING_REVIEW', 'APPROVED', 'LOST_FOUND_OFFICER');
      throw new Error('Expected assertClaimTransition to throw');
    } catch (error) {
      expect(error).toMatchObject({ statusCode: 409, code: 'CONFLICT' });
    }
  });
});
