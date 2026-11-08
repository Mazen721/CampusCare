import type { ItemStatus, Role } from '../../config/constants';
import { ApiError } from '../utils/ApiError';

/**
 * `REPORTER` performs an owner-only action, `SYSTEM` marks side effects triggered
 * by another workflow (a claim being submitted, a claim being auto-rejected).
 */
export type ItemTransitionActor = Role | 'REPORTER' | 'SYSTEM';

export interface ItemTransitionRule {
  from: ItemStatus;
  to: ItemStatus;
  actors: readonly ItemTransitionActor[];
}

/**
 * Item state machine from MASTER_SPEC section 6.2. Services must call
 * assertItemTransition before every status write.
 */
export const ITEM_TRANSITIONS: readonly ItemTransitionRule[] = [
  {
    from: 'OPEN',
    to: 'MATCH_CONFIRMED',
    actors: ['LOST_FOUND_OFFICER'],
  },
  {
    from: 'OPEN',
    to: 'CLAIM_UNDER_REVIEW',
    actors: ['SYSTEM'],
  },
  {
    from: 'MATCH_CONFIRMED',
    to: 'CLAIM_UNDER_REVIEW',
    actors: ['SYSTEM'],
  },
  {
    from: 'CLAIM_UNDER_REVIEW',
    to: 'APPROVED_FOR_HANDOVER',
    actors: ['LOST_FOUND_OFFICER'],
  },
  {
    from: 'CLAIM_UNDER_REVIEW',
    to: 'OPEN',
    actors: ['LOST_FOUND_OFFICER', 'SYSTEM'],
  },
  {
    from: 'APPROVED_FOR_HANDOVER',
    to: 'RETURNED',
    actors: ['LOST_FOUND_OFFICER', 'SYSTEM'],
  },
  // Handover side effect: the claimant's linked LOST item returns to its owner
  // even though its own claim flow never moved it to APPROVED_FOR_HANDOVER.
  { from: 'OPEN', to: 'RETURNED', actors: ['SYSTEM'] },
  { from: 'MATCH_CONFIRMED', to: 'RETURNED', actors: ['SYSTEM'] },
  { from: 'OPEN', to: 'CLOSED', actors: ['LOST_FOUND_OFFICER', 'REPORTER'] },
  {
    from: 'MATCH_CONFIRMED',
    to: 'CLOSED',
    actors: ['LOST_FOUND_OFFICER', 'REPORTER'],
  },
  {
    from: 'CLAIM_UNDER_REVIEW',
    to: 'CLOSED',
    actors: ['LOST_FOUND_OFFICER', 'REPORTER'],
  },
  {
    from: 'APPROVED_FOR_HANDOVER',
    to: 'CLOSED',
    actors: ['LOST_FOUND_OFFICER', 'REPORTER'],
  },
];

export function isItemTransitionAllowed(
  from: ItemStatus,
  to: ItemStatus,
  actor: ItemTransitionActor,
): boolean {
  return ITEM_TRANSITIONS.some(
    (rule) => rule.from === from && rule.to === to && rule.actors.includes(actor),
  );
}

/** Throws a 409 conflict for an illegal item status change or actor. */
export function assertItemTransition(
  from: ItemStatus,
  to: ItemStatus,
  actor: ItemTransitionActor,
): void {
  if (!isItemTransitionAllowed(from, to, actor)) {
    throw ApiError.conflict(
      `Item status cannot change from ${from} to ${to} for this actor`,
      { from, to, actor },
    );
  }
}
