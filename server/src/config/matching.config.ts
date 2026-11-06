/**
 * Deterministic Lost & Found matching configuration (MASTER_SPEC section 6.3).
 * The scoring service is added in Day 5; the weights live here from Day 1 so the
 * `GET /meta` endpoint and unit tests share one source of truth.
 */
export const MATCHING_WEIGHTS = {
  category: 25,
  location: 20,
  date: 20,
  color: 10,
  brand: 10,
  keywords: 15,
} as const;

export const MATCHING_THRESHOLDS = {
  STRONG: 80,
  POSSIBLE: 60,
} as const;

export const KEYWORD_STOP_WORDS = [
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'but',
  'by',
  'for',
  'from',
  'has',
  'have',
  'he',
  'her',
  'his',
  'i',
  'in',
  'is',
  'it',
  'its',
  'my',
  'of',
  'on',
  'or',
  'our',
  'she',
  'that',
  'the',
  'their',
  'them',
  'there',
  'they',
  'this',
  'to',
  'was',
  'we',
  'were',
  'with',
  'you',
  'your',
] as const;

export type MatchingWeights = typeof MATCHING_WEIGHTS;
export type MatchingThresholds = typeof MATCHING_THRESHOLDS;
