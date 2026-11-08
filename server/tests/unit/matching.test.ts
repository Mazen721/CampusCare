import { describe, expect, it } from 'vitest';
import type { MatchableItem } from '../../src/modules/lost-found/matches/matching.service';
import {
  canRefreshMatch,
  scorePair,
} from '../../src/modules/lost-found/matches/matching.service';

const BASE_DATE = new Date('2026-11-01T10:00:00.000Z');

function lostItem(overrides: Partial<MatchableItem> = {}): MatchableItem {
  return {
    id: 'lost-1',
    reportType: 'LOST',
    category: 'Bags',
    location: {
      id: 'location-1',
      buildingName: 'Engineering & Technological Complex',
      floor: 'Floor 2',
    },
    occurrenceDate: BASE_DATE,
    color: 'Black',
    brand: 'North Face',
    itemTitle: 'Black North Face backpack',
    description: 'Lost near the engineering lab with a blue keychain inside.',
    ...overrides,
  };
}

function foundItem(overrides: Partial<MatchableItem> = {}): MatchableItem {
  return {
    id: 'found-1',
    reportType: 'FOUND',
    category: 'Bags',
    location: {
      id: 'location-1',
      buildingName: 'Engineering & Technological Complex',
      floor: 'Floor 2',
    },
    occurrenceDate: BASE_DATE,
    color: 'Black',
    brand: 'North Face',
    itemTitle: 'Black North Face backpack',
    description: 'Found near the engineering lab with a blue keychain inside.',
    ...overrides,
  };
}

describe('Lost & Found deterministic matching', () => {
  it('scores an identical pair as a strong match', () => {
    const result = scorePair(lostItem(), foundItem());

    expect(result).not.toBeNull();
    expect(result?.score).toBe(100);
    expect(result?.level).toBe('STRONG');
    expect(result?.breakdown).toEqual({
      category: 1,
      location: 1,
      date: 1,
      color: 1,
      brand: 1,
      keywords: 1,
    });
  });

  it('scores a same-building, same-category pair as a possible match', () => {
    const result = scorePair(
      lostItem({ color: undefined, brand: undefined }),
      foundItem({
        color: undefined,
        brand: undefined,
        itemTitle: 'Black bag',
        description: 'Found a black bag in the engineering building with books inside.',
        location: {
          id: 'location-2',
          buildingName: 'Engineering & Technological Complex',
          floor: 'Floor 1',
        },
        occurrenceDate: new Date('2026-11-03T12:00:00.000Z'),
      }),
    );

    expect(result).not.toBeNull();
    expect(result?.level).toBe('POSSIBLE');
    expect(result?.score).toBeGreaterThanOrEqual(60);
    expect(result?.score).toBeLessThan(80);
    expect(result?.breakdown.location).toBe(0.6);
    expect(result?.breakdown.date).toBe(0.8);
  });

  it('does not store a pair below the possible threshold', () => {
    const result = scorePair(
      lostItem({
        category: 'Other',
        color: undefined,
        brand: undefined,
        itemTitle: 'Blue umbrella',
        description: 'Left the umbrella somewhere on campus.',
        occurrenceDate: new Date('2026-09-01T10:00:00.000Z'),
      }),
      foundItem({
        category: 'Electronics',
        color: undefined,
        brand: undefined,
        itemTitle: 'Charger cable',
        description: 'A short black charging cable.',
        occurrenceDate: new Date('2026-11-01T10:00:00.000Z'),
        location: {
          id: 'location-9',
          buildingName: 'Medical Sector Complex',
          floor: 'Ground Floor',
        },
      }),
    );

    expect(result).not.toBeNull();
    expect(result?.score).toBeLessThan(60);
    expect(result?.level).toBeNull();
  });

  it('does not penalize missing colour or brand', () => {
    const complete = scorePair(lostItem(), foundItem());
    const missingOptionalFields = scorePair(
      lostItem({ color: undefined, brand: undefined }),
      foundItem({ color: undefined, brand: undefined }),
    );

    expect(complete?.score).toBe(100);
    expect(missingOptionalFields?.score).toBe(100);
    expect(missingOptionalFields?.breakdown.color).toBe(0);
    expect(missingOptionalFields?.breakdown.brand).toBe(0);
  });

  it('skips incompatible categories unless one side is Other', () => {
    expect(
      scorePair(lostItem({ category: 'Electronics' }), foundItem({ category: 'Bags' })),
    ).toBeNull();

    const withOther = scorePair(
      lostItem({ category: 'Other' }),
      foundItem({ category: 'Bags' }),
    );

    expect(withOther).not.toBeNull();
    expect(withOther?.breakdown.category).toBe(0.4);
  });

  it('skips a found item dated more than 24 hours before the lost item', () => {
    const twentyFiveHoursBefore = new Date(BASE_DATE.getTime() - 25 * 60 * 60 * 1000);
    const twentyThreeHoursBefore = new Date(BASE_DATE.getTime() - 23 * 60 * 60 * 1000);

    expect(
      scorePair(lostItem(), foundItem({ occurrenceDate: twentyFiveHoursBefore })),
    ).toBeNull();
    expect(
      scorePair(lostItem(), foundItem({ occurrenceDate: twentyThreeHoursBefore })),
    ).not.toBeNull();
  });

  it('never refreshes a confirmed or dismissed match', () => {
    expect(canRefreshMatch('SUGGESTED')).toBe(true);
    expect(canRefreshMatch('CONFIRMED')).toBe(false);
    expect(canRefreshMatch('DISMISSED')).toBe(false);
  });

  it('uses configurable weights and thresholds', () => {
    const categoryOnly = {
      weights: {
        category: 100,
        location: 0,
        date: 0,
        color: 0,
        brand: 0,
        keywords: 0,
      },
      thresholds: { STRONG: 90, POSSIBLE: 50 },
    };

    const strong = scorePair(lostItem(), foundItem(), categoryOnly);
    expect(strong?.score).toBe(100);
    expect(strong?.level).toBe('STRONG');

    const otherCategory = scorePair(
      lostItem({ category: 'Other' }),
      foundItem({ category: 'Bags' }),
      categoryOnly,
    );
    expect(otherCategory?.score).toBe(40);
    expect(otherCategory?.level).toBeNull();

    const relaxed = scorePair(lostItem({ category: 'Other' }), foundItem({ category: 'Bags' }), {
      ...categoryOnly,
      thresholds: { STRONG: 90, POSSIBLE: 30 },
    });
    expect(relaxed?.score).toBe(40);
    expect(relaxed?.level).toBe('POSSIBLE');
  });

  it('applies the documented date proximity bands', () => {
    const bands: Array<[number, number]> = [
      [0, 1],
      [2, 0.8],
      [4, 0.5],
      [8, 0.2],
      [15, 0],
    ];

    for (const [days, expected] of bands) {
      const result = scorePair(
        lostItem(),
        foundItem({
          occurrenceDate: new Date(BASE_DATE.getTime() + days * 24 * 60 * 60 * 1000),
        }),
      );
      expect(result?.breakdown.date).toBe(expected);
    }
  });
});
