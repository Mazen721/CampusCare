import type { ImageAsset } from '@/types/maintenance';
import type { Role } from '@/types/auth';
import type { LostFoundItem } from '@/types/lostFound';

export const CLAIM_STATUSES = [
  'PENDING_REVIEW',
  'UNDER_VERIFICATION',
  'APPROVED',
  'REJECTED',
  'COMPLETED',
] as const;
export type ClaimStatus = (typeof CLAIM_STATUSES)[number];

export interface ClaimItem extends LostFoundItem {
  /** Only returned to Lost & Found Officers. */
  privateIdentificationDetails?: string;
}

export interface ClaimPerson {
  id: string;
  name: string;
  email?: string;
  department?: string;
  role?: Role;
}

export interface ClaimReviewer {
  id: string;
  name: string;
  role?: Role;
}

export interface ClaimHandover {
  receivedByName?: string;
  handedOverBy: { id: string; name: string } | null;
  notes?: string;
  handedOverAt?: string;
}

export interface ClaimRecord {
  id: string;
  claimNumber: string;
  status: ClaimStatus;
  item: ClaimItem | null;
  linkedLostItem: LostFoundItem | null;
  claimant: ClaimPerson | null;
  claimDescription: string;
  identifyingDetailsProvided: string;
  supportingEvidence: ImageAsset[];
  verificationNotes?: string;
  rejectionReason?: string;
  reviewedBy: ClaimReviewer | null;
  reviewedAt?: string;
  handover?: ClaimHandover;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClaimInput {
  itemId: string;
  claimDescription: string;
  identifyingDetailsProvided: string;
  linkedLostItemId?: string;
  images: File[];
}

export interface ListClaimsParams {
  status?: ClaimStatus;
  itemId?: string;
  page?: number;
  limit?: number;
}

export type ClaimReviewAction = 'START_VERIFICATION' | 'APPROVE' | 'REJECT';

export interface ReviewClaimInput {
  action: ClaimReviewAction;
  notes?: string;
  rejectionReason?: string;
}

export interface HandoverClaimInput {
  receivedByName: string;
  notes?: string;
}
