import type { ClientSession } from 'mongoose';
import { Counter } from '../models/Counter.model';

export const COUNTER_PREFIXES = ['MR', 'WO', 'LF', 'CLM'] as const;
export type CounterPrefix = (typeof COUNTER_PREFIXES)[number];

/**
 * Atomically increments a human-readable number series.
 * MR -> MR-1001, WO -> WO-1001, LF -> LF-1001, CLM -> CLM-1001.
 */
export async function nextNumber(
  prefix: CounterPrefix,
  session?: ClientSession,
): Promise<string> {
  const counter = await Counter.findOneAndUpdate(
    { _id: prefix },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, session },
  );

  if (!counter) {
    throw new Error(`Unable to increment the ${prefix} counter`);
  }

  return `${prefix}-${1000 + counter.seq}`;
}
