import type { RequestStatus, Role } from '../../config/constants';
import { ApiError } from '../utils/ApiError';

/**
 * The actor is a role for staff actions, `OWNER` when the requester performs an
 * owner-only action, or `SYSTEM` for side effects triggered by Work Order changes.
 */
export type RequestTransitionActor = Role | 'OWNER' | 'SYSTEM';

export interface RequestTransitionRule {
  from: RequestStatus;
  to: RequestStatus;
  actors: readonly RequestTransitionActor[];
}

/**
 * Request state machine from MASTER_SPEC section 5.2. There is no free-form
 * status endpoint; services must call assertTransition before every status write.
 */
export const REQUEST_TRANSITIONS: readonly RequestTransitionRule[] = [
  { from: 'SUBMITTED', to: 'UNDER_REVIEW', actors: ['MAINTENANCE_MANAGER'] },
  {
    from: 'SUBMITTED',
    to: 'APPROVED',
    actors: ['MAINTENANCE_MANAGER'],
  },
  {
    from: 'UNDER_REVIEW',
    to: 'APPROVED',
    actors: ['MAINTENANCE_MANAGER'],
  },
  {
    from: 'SUBMITTED',
    to: 'REJECTED',
    actors: ['MAINTENANCE_MANAGER'],
  },
  {
    from: 'UNDER_REVIEW',
    to: 'REJECTED',
    actors: ['MAINTENANCE_MANAGER'],
  },
  { from: 'APPROVED', to: 'IN_PROGRESS', actors: ['SYSTEM'] },
  { from: 'APPROVED', to: 'UNDER_REVIEW', actors: ['SYSTEM'] },
  { from: 'IN_PROGRESS', to: 'UNDER_REVIEW', actors: ['SYSTEM'] },
  { from: 'REOPENED', to: 'UNDER_REVIEW', actors: ['SYSTEM'] },
  { from: 'IN_PROGRESS', to: 'COMPLETED', actors: ['SYSTEM'] },
  {
    from: 'COMPLETED',
    to: 'CLOSED',
    actors: ['OWNER', 'MAINTENANCE_MANAGER'],
  },
  {
    from: 'COMPLETED',
    to: 'REOPENED',
    actors: ['OWNER', 'MAINTENANCE_MANAGER'],
  },
  { from: 'REOPENED', to: 'IN_PROGRESS', actors: ['SYSTEM'] },
  { from: 'REOPENED', to: 'CLOSED', actors: ['MAINTENANCE_MANAGER'] },
];

export function isTransitionAllowed(
  from: RequestStatus,
  to: RequestStatus,
  actor: RequestTransitionActor,
): boolean {
  return REQUEST_TRANSITIONS.some(
    (rule) => rule.from === from && rule.to === to && rule.actors.includes(actor),
  );
}

/**
 * Throws a 409 conflict for any transition that is not in the table or whose
 * actor is not permitted to perform it.
 */
export function assertTransition(
  from: RequestStatus,
  to: RequestStatus,
  actor: RequestTransitionActor,
): void {
  if (!isTransitionAllowed(from, to, actor)) {
    throw ApiError.conflict(
      `Request status cannot change from ${from} to ${to} for this actor`,
      { from, to, actor },
    );
  }
}
