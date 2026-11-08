import type { ClaimStatus } from '../../config/constants';
import { ApiError } from '../utils/ApiError';

/**
 * `SYSTEM` marks an automatic rejection triggered when another claim on the
 * same item is approved. Officers perform every other transition.
 */
export type ClaimTransitionActor = 'LOST_FOUND_OFFICER' | 'SYSTEM';

export interface ClaimTransitionRule {
  from: ClaimStatus;
  to: ClaimStatus;
  actors: readonly ClaimTransitionActor[];
}

/**
 * Claim state machine from MASTER_SPEC section 6.4. Services must call
 * assertClaimTransition before every status write.
 */
export const CLAIM_TRANSITIONS: readonly ClaimTransitionRule[] = [
  {
    from: 'PENDING_REVIEW',
    to: 'UNDER_VERIFICATION',
    actors: ['LOST_FOUND_OFFICER'],
  },
  {
    from: 'UNDER_VERIFICATION',
    to: 'APPROVED',
    actors: ['LOST_FOUND_OFFICER'],
  },
  {
    from: 'PENDING_REVIEW',
    to: 'REJECTED',
    actors: ['LOST_FOUND_OFFICER', 'SYSTEM'],
  },
  {
    from: 'UNDER_VERIFICATION',
    to: 'REJECTED',
    actors: ['LOST_FOUND_OFFICER', 'SYSTEM'],
  },
  {
    from: 'APPROVED',
    to: 'COMPLETED',
    actors: ['LOST_FOUND_OFFICER'],
  },
];

export function isClaimTransitionAllowed(
  from: ClaimStatus,
  to: ClaimStatus,
  actor: ClaimTransitionActor,
): boolean {
  return CLAIM_TRANSITIONS.some(
    (rule) => rule.from === from && rule.to === to && rule.actors.includes(actor),
  );
}

/** Throws a 409 conflict for an illegal claim status change or actor. */
export function assertClaimTransition(
  from: ClaimStatus,
  to: ClaimStatus,
  actor: ClaimTransitionActor,
): void {
  if (!isClaimTransitionAllowed(from, to, actor)) {
    throw ApiError.conflict(
      `Claim status cannot change from ${from} to ${to} for this actor`,
      { from, to, actor },
    );
  }
}
