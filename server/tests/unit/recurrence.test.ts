import { describe, expect, it } from 'vitest';
import { advancePastNow, nextDate } from '../../src/modules/preventive/recurrence';

const at = (year: number, month: number, day: number, hour = 12): Date =>
  new Date(year, month - 1, day, hour, 0, 0, 0);

function expectDate(actual: Date, expected: Date): void {
  expect(actual.getFullYear()).toBe(expected.getFullYear());
  expect(actual.getMonth()).toBe(expected.getMonth());
  expect(actual.getDate()).toBe(expected.getDate());
  expect(actual.getHours()).toBe(expected.getHours());
}

describe('preventive recurrence', () => {
  it('adds one day for DAILY plans', () => {
    expectDate(nextDate(at(2026, 11, 8), { recurrenceType: 'DAILY' }), at(2026, 11, 9));
  });

  it('adds seven days for WEEKLY plans', () => {
    expectDate(nextDate(at(2026, 11, 8), { recurrenceType: 'WEEKLY' }), at(2026, 11, 15));
  });

  it('adds one calendar month for MONTHLY plans', () => {
    expectDate(nextDate(at(2026, 11, 8), { recurrenceType: 'MONTHLY' }), at(2026, 12, 8));
  });

  it('clamps MONTHLY month-end dates to the last day of the next month', () => {
    expectDate(nextDate(at(2026, 1, 31), { recurrenceType: 'MONTHLY' }), at(2026, 2, 28));
    expectDate(nextDate(at(2026, 3, 31), { recurrenceType: 'MONTHLY' }), at(2026, 4, 30));
    expectDate(nextDate(at(2028, 1, 31), { recurrenceType: 'MONTHLY' }), at(2028, 2, 29));
  });

  it('uses recurrenceIntervalDays for CUSTOM_DAYS plans', () => {
    expectDate(
      nextDate(at(2026, 11, 8), {
        recurrenceType: 'CUSTOM_DAYS',
        recurrenceIntervalDays: 10,
      }),
      at(2026, 11, 18),
    );
  });

  it('rejects a CUSTOM_DAYS plan without a positive interval', () => {
    expect(() => nextDate(at(2026, 11, 8), { recurrenceType: 'CUSTOM_DAYS' })).toThrow(
      /positive integer/,
    );
    expect(() =>
      nextDate(at(2026, 11, 8), {
        recurrenceType: 'CUSTOM_DAYS',
        recurrenceIntervalDays: 0,
      }),
    ).toThrow(/positive integer/);
  });

  it('skips missed occurrences until the next date is in the future', () => {
    const next = advancePastNow(
      at(2026, 1, 1),
      { recurrenceType: 'DAILY' },
      at(2026, 1, 10),
    );
    expectDate(next, at(2026, 1, 11));
  });

  it('returns the current date when it is already in the future', () => {
    const next = advancePastNow(
      at(2026, 12, 1),
      { recurrenceType: 'WEEKLY' },
      at(2026, 11, 8),
    );
    expectDate(next, at(2026, 12, 1));
  });

  it('advances month-end occurrences without backfilling', () => {
    const next = advancePastNow(
      at(2026, 1, 31),
      { recurrenceType: 'MONTHLY' },
      at(2026, 3, 1),
    );
    expectDate(next, at(2026, 3, 28));
  });

  it('skips multiple missed custom intervals', () => {
    const next = advancePastNow(
      at(2026, 1, 1),
      { recurrenceType: 'CUSTOM_DAYS', recurrenceIntervalDays: 10 },
      at(2026, 1, 25),
    );
    expectDate(next, at(2026, 1, 31));
  });
});
