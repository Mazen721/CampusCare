import type { Request, Response } from 'express';
import { uploadImages } from '../../../shared/services/upload.service';
import { ApiError } from '../../../shared/utils/ApiError';
import { asyncHandler } from '../../../shared/utils/asyncHandler';
import {
  createClaim as createClaimService,
  getClaim as getClaimService,
  listClaims as listClaimsService,
  recordHandover as recordHandoverService,
  reviewClaim as reviewClaimService,
} from './claim.service';
import type { ClaimActor } from './claim.service';
import type {
  CreateClaimInput,
  HandoverClaimInput,
  ListClaimsQuery,
  ReviewClaimInput,
} from './claim.validation';

function requireActor(req: Request): ClaimActor {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  return { id: req.user._id.toString(), role: req.user.role };
}

function requestBaseUrl(req: Request): string {
  const host = req.get('host');
  return host ? `${req.protocol}://${host}` : '';
}

function uploadedFiles(req: Request): Express.Multer.File[] {
  return Array.isArray(req.files) ? req.files : [];
}

export const createClaim = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  const images = await uploadImages(uploadedFiles(req), requestBaseUrl(req));
  const claim = await createClaimService(
    actor,
    req.body as CreateClaimInput,
    images,
  );
  res.status(201).json({ claim });
});

export const listClaims = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  const result = await listClaimsService(
    actor,
    req.query as unknown as ListClaimsQuery,
  );
  res.status(200).json(result);
});

export const getClaim = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  const { id } = req.params as { id: string };
  const claim = await getClaimService(actor, id);
  res.status(200).json({ claim });
});

export const reviewClaim = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  const { id } = req.params as { id: string };
  const claim = await reviewClaimService(
    actor,
    id,
    req.body as ReviewClaimInput,
  );
  res.status(200).json({ claim });
});

export const recordHandover = asyncHandler(
  async (req: Request, res: Response) => {
    const actor = requireActor(req);
    const { id } = req.params as { id: string };
    const claim = await recordHandoverService(
      actor,
      id,
      req.body as HandoverClaimInput,
    );
    res.status(200).json({ claim });
  },
);
