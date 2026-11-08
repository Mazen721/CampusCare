import type { LostFoundItem } from '@/types/lostFound';
import type { Role } from '@/types/auth';

export const MATCH_LEVELS = ['STRONG', 'POSSIBLE'] as const;
export type MatchLevel = (typeof MATCH_LEVELS)[number];

export const MATCH_STATUSES = ['SUGGESTED', 'CONFIRMED', 'DISMISSED'] as const;
export type MatchStatus = (typeof MATCH_STATUSES)[number];

export interface MatchBreakdown {
  category: number;
  location: number;
  date: number;
  color: number;
  brand: number;
  keywords: number;
}

export interface MatchReviewer {
  id: string;
  name: string;
  role?: Role;
}

export interface ItemMatch {
  id: string;
  score: number;
  level: MatchLevel;
  status: MatchStatus;
  breakdown: MatchBreakdown;
  lostItem: LostFoundItem | null;
  foundItem: LostFoundItem | null;
  reviewedBy: MatchReviewer | null;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListMatchesParams {
  status?: MatchStatus;
  itemId?: string;
  page?: number;
  limit?: number;
}

export interface ReviewMatchInput {
  action: 'CONFIRM' | 'DISMISS';
}
