import { addDays, addMonths } from 'date-fns';
import type { RecurrenceType } from '../../config/constants';

export interface RecurrenceRule {
  recurrenceType: RecurrenceType;
  recurrenceIntervalDays?: number;
}

const MAX_ADVANCE_STEPS = 10_000;

function resolveIntervalDays(rule: RecurrenceRule): number {
  const interval = rule.recurrenceIntervalDays;

  if (!interval || !Number.isInteger(interval) || interval < 1) {
    throw new Error('recurrenceIntervalDays must be a positive integer for CUSTOM_DAYS plans');
  }

  return interval;
}

/**
 * Returns the next occurrence after `current`. Monthly plans add one calendar
 * month, so a month-end date is clamped to the last day of the following month
 * (for example 31 January -> 28 February in a non-leap year).
 */
export function nextDate(current: Date, rule: RecurrenceRule): Date {
  switch (rule.recurrenceType) {
    case 'DAILY':
      return addDays(current, 1);
    case 'WEEKLY':
      return addDays(current, 7);
    case 'MONTHLY':
      return addMonths(current, 1);
    case 'CUSTOM_DAYS':
      return addDays(current, resolveIntervalDays(rule));
    default: {
      const exhaustive: never = rule.recurrenceType;
      throw new Error(`Unsupported recurrence type: ${String(exhaustive)}`);
    }
  }
}

/**
 * Advances an occurrence until it is strictly after `now`. Missed occurrences
 * are skipped, never backfilled.
 */
export function advancePastNow(
  current: Date,
  rule: RecurrenceRule,
  now: Date = new Date(),
): Date {
  let next = new Date(current);

  for (let step = 0; step < MAX_ADVANCE_STEPS && next.getTime() <= now.getTime(); step += 1) {
    next = nextDate(next, rule);
  }

  if (next.getTime() <= now.getTime()) {
    throw new Error('Unable to advance the recurrence past the current date');
  }

  return next;
}
