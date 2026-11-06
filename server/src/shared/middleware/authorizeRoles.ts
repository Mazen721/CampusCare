import type { RequestHandler } from 'express';
import type { Role } from '../../config/constants';
import { ApiError } from '../utils/ApiError';

/**
 * Role gate for a route. Ownership checks still belong in the service layer.
 */
export function authorizeRoles(...roles: Role[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      next(ApiError.unauthorized());
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(ApiError.forbidden());
      return;
    }

    next();
  };
}
