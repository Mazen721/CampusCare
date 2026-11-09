import type { Role, WorkOrderStatus } from '../../config/constants';
import { ApiError } from '../utils/ApiError';

/**
 * The actor is a role for staff actions (e.g. MAINTENANCE_MANAGER or TECHNICIAN),
 * or SYSTEM for automatic side-effects such as reopening a completed work order.
 */
export type WorkOrderTransitionActor = Role | 'SYSTEM';

export interface WorkOrderTransitionRule {
  from: WorkOrderStatus;
  to: WorkOrderStatus;
  actors: readonly WorkOrderTransitionActor[];
}

/**
 * Work Order state machine from MASTER_SPEC section 5.3 and data-model.md.
 * Services must call assertWorkOrderTransition before persisting any status write.
 */
export const WORK_ORDER_TRANSITIONS: readonly WorkOrderTransitionRule[] = [
  {
    from: 'PENDING_ASSIGNMENT',
    to: 'ASSIGNED',
    actors: ['MAINTENANCE_MANAGER'],
  },
  {
    from: 'ASSIGNED',
    to: 'ASSIGNED',
    actors: ['MAINTENANCE_MANAGER'],
  },
  {
    from: 'ASSIGNED',
    to: 'IN_PROGRESS',
    actors: ['TECHNICIAN'],
  },
  {
    from: 'IN_PROGRESS',
    to: 'COMPLETED',
    actors: ['TECHNICIAN'],
  },
  {
    from: 'PENDING_ASSIGNMENT',
    to: 'CANCELLED',
    actors: ['MAINTENANCE_MANAGER'],
  },
  {
    from: 'ASSIGNED',
    to: 'CANCELLED',
    actors: ['MAINTENANCE_MANAGER'],
  },
  {
    from: 'IN_PROGRESS',
    to: 'CANCELLED',
    actors: ['MAINTENANCE_MANAGER'],
  },
  {
    from: 'COMPLETED',
    to: 'ASSIGNED',
    actors: ['SYSTEM'],
  },
];

export function isWorkOrderTransitionAllowed(
  from: WorkOrderStatus,
  to: WorkOrderStatus,
  actor: WorkOrderTransitionActor,
): boolean {
  return WORK_ORDER_TRANSITIONS.some(
    (rule) => rule.from === from && rule.to === to && rule.actors.includes(actor),
  );
}

/**
 * Throws a 409 conflict for any transition that is not allowed or whose
 * actor is not permitted to perform it.
 */
export function assertWorkOrderTransition(
  from: WorkOrderStatus,
  to: WorkOrderStatus,
  actor: WorkOrderTransitionActor,
): void {
  if (!isWorkOrderTransitionAllowed(from, to, actor)) {
    throw ApiError.conflict(
      `Work order status cannot change from ${from} to ${to} for this actor`,
      'invalidWorkOrderTransition',
      { from, to, actor },
    );
  }
}

// Aliases for convenience matching request.sm.ts
export const isTransitionAllowed = isWorkOrderTransitionAllowed;
export const assertTransition = assertWorkOrderTransition;
