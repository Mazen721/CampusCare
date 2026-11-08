import type {
  LostFoundCategory,
  MatchLevel,
  ReportType,
} from '../../../config/constants';
import {
  KEYWORD_STOP_WORDS,
  MATCHING_THRESHOLDS,
  MATCHING_WEIGHTS,
} from '../../../config/matching.config';
import type { MatchBreakdown } from './itemMatch.model';

const DAY_MS = 24 * 60 * 60 * 1000;
const KEYWORD_SCALE = 0.4;
const STOP_WORDS = new Set<string>(KEYWORD_STOP_WORDS);

export type MatchWeightKey = keyof MatchBreakdown;

export interface MatchingConfig {
  weights: Record<MatchWeightKey, number>;
  thresholds: { STRONG: number; POSSIBLE: number };
}

export interface MatchableLocation {
  id: string;
  buildingName?: string;
  floor?: string;
}

export interface MatchableItem {
  id: string;
  reportType: ReportType;
  category: LostFoundCategory;
  location: MatchableLocation | null;
  occurrenceDate: Date;
  color?: string;
  brand?: string;
  itemTitle: string;
  description: string;
}

export interface MatchScore {
  score: number;
  /** Null when the pair scores below the POSSIBLE threshold. */
  level: MatchLevel | null;
  breakdown: MatchBreakdown;
}

export const DEFAULT_MATCHING_CONFIG: MatchingConfig = {
  weights: MATCHING_WEIGHTS,
  thresholds: MATCHING_THRESHOLDS,
};

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function round(value: number, digits = 4): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function tokenizeWords(value: string): string[] {
  return normalize(value)
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function keywordTokens(value: string, stopWords: Set<string>): Set<string> {
  return new Set(tokenizeWords(value).filter((token) => !stopWords.has(token)));
}

function categorySubScore(
  lost: MatchableItem,
  found: MatchableItem,
): number | null {
  if (lost.category === found.category) {
    return 1;
  }

  if (lost.category === 'Other' || found.category === 'Other') {
    return 0.4;
  }

  // Incompatible categories are a hard filter.
  return null;
}

function locationSubScore(
  lost: MatchableItem,
  found: MatchableItem,
): number {
  if (!lost.location || !found.location) {
    return 0;
  }

  if (lost.location.id === found.location.id) {
    return 1;
  }

  const lostBuilding = lost.location.buildingName
    ? normalize(lost.location.buildingName)
    : undefined;
  const foundBuilding = found.location.buildingName
    ? normalize(found.location.buildingName)
    : undefined;

  if (!lostBuilding || !foundBuilding || lostBuilding !== foundBuilding) {
    return 0;
  }

  const lostFloor = lost.location.floor ? normalize(lost.location.floor) : undefined;
  const foundFloor = found.location.floor ? normalize(found.location.floor) : undefined;

  return lostFloor && foundFloor && lostFloor === foundFloor ? 0.8 : 0.6;
}

function dateSubScore(lost: MatchableItem, found: MatchableItem): number {
  const gapDays =
    Math.abs(found.occurrenceDate.getTime() - lost.occurrenceDate.getTime()) /
    DAY_MS;

  if (gapDays <= 1) return 1;
  if (gapDays <= 3) return 0.8;
  if (gapDays <= 7) return 0.5;
  if (gapDays <= 14) return 0.2;
  return 0;
}

function colorSubScore(
  lost: MatchableItem,
  found: MatchableItem,
): { score: number; comparable: boolean } {
  const lostColor = lost.color?.trim();
  const foundColor = found.color?.trim();

  if (!lostColor || !foundColor) {
    return { score: 0, comparable: false };
  }

  if (normalize(lostColor) === normalize(foundColor)) {
    return { score: 1, comparable: true };
  }

  const lostWords = new Set(tokenizeWords(lostColor));
  const sharesWord = tokenizeWords(foundColor).some((word) => lostWords.has(word));

  return { score: sharesWord ? 0.7 : 0, comparable: true };
}

function brandSubScore(
  lost: MatchableItem,
  found: MatchableItem,
): { score: number; comparable: boolean } {
  const lostBrand = lost.brand?.trim();
  const foundBrand = found.brand?.trim();

  if (!lostBrand || !foundBrand) {
    return { score: 0, comparable: false };
  }

  const left = normalize(lostBrand);
  const right = normalize(foundBrand);

  return {
    score: left === right || left.includes(right) || right.includes(left) ? 1 : 0,
    comparable: true,
  };
}

function keywordSubScore(
  lost: MatchableItem,
  found: MatchableItem,
  stopWords: Set<string>,
): number {
  const lostTokens = keywordTokens(
    `${lost.itemTitle} ${lost.description}`,
    stopWords,
  );
  const foundTokens = keywordTokens(
    `${found.itemTitle} ${found.description}`,
    stopWords,
  );

  if (lostTokens.size === 0 || foundTokens.size === 0) {
    return 0;
  }

  let intersection = 0;
  lostTokens.forEach((token) => {
    if (foundTokens.has(token)) intersection += 1;
  });

  const union = new Set([...lostTokens, ...foundTokens]).size;
  const jaccard = union === 0 ? 0 : intersection / union;

  return Math.min(1, jaccard / KEYWORD_SCALE);
}

/**
 * Deterministic Lost & Found pair scoring from MASTER_SPEC section 6.3.
 * Pure: no database or network access. Returns null when a hard filter skips
 * the pair, otherwise the score, level (null below POSSIBLE) and sub-scores.
 */
export function scorePair(
  lost: MatchableItem,
  found: MatchableItem,
  config: MatchingConfig = DEFAULT_MATCHING_CONFIG,
): MatchScore | null {
  if (lost.reportType !== 'LOST' || found.reportType !== 'FOUND') {
    return null;
  }

  const category = categorySubScore(lost, found);
  if (category === null) {
    return null;
  }

  const foundBeforeLostMs =
    lost.occurrenceDate.getTime() - found.occurrenceDate.getTime();
  if (foundBeforeLostMs > DAY_MS) {
    return null;
  }

  const color = colorSubScore(lost, found);
  const brand = brandSubScore(lost, found);

  const breakdown: MatchBreakdown = {
    category,
    location: locationSubScore(lost, found),
    date: dateSubScore(lost, found),
    color: color.score,
    brand: brand.score,
    keywords: keywordSubScore(lost, found, STOP_WORDS),
  };

  let weightedTotal = 0;
  let comparableWeight = 0;

  const add = (key: MatchWeightKey, subScore: number): void => {
    const weight = config.weights[key];
    weightedTotal += weight * subScore;
    comparableWeight += weight;
  };

  add('category', breakdown.category);
  add('location', breakdown.location);
  add('date', breakdown.date);

  if (color.comparable) add('color', breakdown.color);
  if (brand.comparable) add('brand', breakdown.brand);

  add('keywords', breakdown.keywords);

  const score =
    comparableWeight === 0 ? 0 : round((weightedTotal / comparableWeight) * 100, 2);
  const level: MatchLevel | null =
    score >= config.thresholds.STRONG
      ? 'STRONG'
      : score >= config.thresholds.POSSIBLE
        ? 'POSSIBLE'
        : null;

  return { score, level, breakdown };
}

/**
 * Matches are refreshed only while they are still suggestions. Confirmed and
 * dismissed decisions are final and must never be revived by recalculation.
 */
export function canRefreshMatch(status: string): boolean {
  return status === 'SUGGESTED';
}
