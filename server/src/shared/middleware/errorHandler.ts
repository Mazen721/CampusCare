import type { ErrorRequestHandler, RequestHandler } from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import { ZodError } from 'zod';
import { env } from '../../config/env';
import { ApiError } from '../utils/ApiError';

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} was not found`,
    },
  });
};

interface ErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

function buildErrorBody(code: string, message: string, details?: unknown): ErrorBody {
  return {
    error: {
      code,
      message,
      ...(details === undefined ? {} : { details }),
    },
  };
}

export const errorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error instanceof ApiError) {
    res.status(error.statusCode).json(buildErrorBody(error.code, error.message, error.details));
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json(
      buildErrorBody('VALIDATION', 'Validation failed', {
        issues: error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      }),
    );
    return;
  }

  if (error instanceof mongoose.Error.ValidationError) {
    res.status(400).json(
      buildErrorBody(
        'VALIDATION',
        'Validation failed',
        Object.values(error.errors).map((issue) => issue.message),
      ),
    );
    return;
  }

  if (error instanceof mongoose.Error.CastError) {
    res.status(400).json(buildErrorBody('VALIDATION', 'An identifier is not valid'));
    return;
  }

  const duplicateKey = error as { code?: number; keyValue?: Record<string, unknown> };
  if (duplicateKey.code === 11_000) {
    res
      .status(409)
      .json(
        buildErrorBody(
          'DUPLICATE',
          'A record with these details already exists',
          duplicateKey.keyValue,
        ),
      );
    return;
  }

  if (error instanceof multer.MulterError) {
    const isSizeError = error.code === 'LIMIT_FILE_SIZE';
    res
      .status(isSizeError ? 413 : 400)
      .json(
        buildErrorBody(
          isSizeError ? 'UPLOAD_TOO_LARGE' : 'UPLOAD_INVALID',
          isSizeError ? 'Each image must be 5 MB or smaller' : error.message,
        ),
      );
    return;
  }

  const isJsonSyntaxError =
    error instanceof SyntaxError && 'body' in (error as unknown as Record<string, unknown>);
  if (isJsonSyntaxError) {
    res.status(400).json(buildErrorBody('INVALID_JSON', 'The request body is not valid JSON'));
    return;
  }

  const message =
    env.IS_PRODUCTION || !(error instanceof Error)
      ? 'Something went wrong. Please try again.'
      : error.message;

  if (env.NODE_ENV !== 'test') {
    console.error('[campuscare] unhandled error', error);
  }

  res.status(500).json(buildErrorBody('INTERNAL', message));
};
