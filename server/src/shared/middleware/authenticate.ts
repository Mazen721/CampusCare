import type { Request } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { env } from '../../config/env';
import { User } from '../../modules/auth/user.model';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';

function extractBearerToken(req: Request): string | null {
  const header = req.header('authorization');
  if (!header) return null;

  const [scheme, token] = header.split(' ');
  if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) return null;

  return token.trim() || null;
}

export const authenticate = asyncHandler(async (req, _res, next) => {
  const token = extractBearerToken(req);

  if (!token) {
    throw ApiError.unauthorized();
  }

  let payload: JwtPayload;
  try {
    const verified = jwt.verify(token, env.JWT_SECRET);
    if (typeof verified === 'string') {
      throw new Error('Unexpected JWT payload');
    }
    payload = verified;
  } catch {
    throw ApiError.unauthorized('Your session is invalid or has expired', 'sessionExpired');
  }

  if (!payload.sub || typeof payload.sub !== 'string') {
    throw ApiError.unauthorized('Your session is invalid or has expired', 'sessionExpired');
  }

  const user = await User.findById(payload.sub);

  if (!user || !user.isActive) {
    throw ApiError.unauthorized('This account is inactive or no longer exists', 'accountInactive');
  }

  req.user = user;
  next();
});
