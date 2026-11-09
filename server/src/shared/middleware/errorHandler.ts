import type { ErrorRequestHandler, RequestHandler } from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import { ZodError } from 'zod';
import { env } from '../../config/env';
import { ApiError } from '../utils/ApiError';

export const notFoundHandler: RequestHandler = (_req, res) => {
  res
    .status(404)
    .json(buildErrorBody('NOT_FOUND', 'Route not found', { messageKey: 'routeNotFound' }));
};

export interface ErrorBody {
  error: {
    code: string;
    message: string;
    messageKey?: string;
    params?: Record<string, string | number>;
    details?: unknown;
  };
}

export interface ErrorBodyOptions {
  details?: unknown;
  messageKey?: string;
  params?: Record<string, string | number>;
}

export function buildErrorBody(
  code: string,
  message: string,
  options?: ErrorBodyOptions,
): ErrorBody {
  return {
    error: {
      code,
      message,
      ...(options?.messageKey ? { messageKey: options.messageKey } : {}),
      ...(options?.params ? { params: options.params } : {}),
      ...(options?.details === undefined ? {} : { details: options.details }),
    },
  };
}

export const errorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error instanceof ApiError) {
    res.status(error.statusCode).json(
      buildErrorBody(error.code, error.message, {
        details: error.details,
        messageKey: error.messageKey,
        params: error.params,
      }),
    );
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json(
      buildErrorBody('VALIDATION', 'Validation failed', {
        details: {
          issues: error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        },
        messageKey: 'validationFailed',
      }),
    );
    return;
  }

  if (error instanceof mongoose.Error.ValidationError) {
    res.status(400).json(
      buildErrorBody('VALIDATION', 'Validation failed', {
        details: Object.values(error.errors).map((issue) => issue.message),
        messageKey: 'validationFailed',
      }),
    );
    return;
  }

  if (error instanceof mongoose.Error.CastError) {
    res.status(400).json(
      buildErrorBody('VALIDATION', 'An identifier is not valid', { messageKey: 'validationFailed' }),
    );
    return;
  }

  const duplicateKey = error as { code?: number; keyValue?: Record<string, unknown> };
  if (duplicateKey.code === 11_000) {
    res.status(409).json(
      buildErrorBody('DUPLICATE', 'A record with these details already exists', {
        details: duplicateKey.keyValue,
        messageKey: 'duplicateRecord',
      }),
    );
    return;
  }

  if (error instanceof multer.MulterError) {
    const isSizeError = error.code === 'LIMIT_FILE_SIZE';
    const isCountError = error.code === 'LIMIT_FILE_COUNT' || error.code === 'LIMIT_UNEXPECTED_FILE';

    res.status(isSizeError ? 413 : 400).json(
      buildErrorBody(
        isSizeError ? 'UPLOAD_TOO_LARGE' : 'UPLOAD_INVALID',
        isSizeError
          ? 'Each image must be 5 MB or smaller'
          : isCountError
            ? 'A maximum of 3 images can be attached'
            : error.message,
        { messageKey: isSizeError ? 'uploadTooLarge' : 'uploadInvalid' },
      ),
    );
    return;
  }

  const isJsonSyntaxError =
    error instanceof SyntaxError && 'body' in (error as unknown as Record<string, unknown>);
  if (isJsonSyntaxError) {
    res.status(400).json(
      buildErrorBody('INVALID_JSON', 'The request body is not valid JSON', { messageKey: 'invalidJson' }),
    );
    return;
  }

  const message =
    env.IS_PRODUCTION || !(error instanceof Error)
      ? 'Something went wrong. Please try again.'
      : error.message;

  if (env.NODE_ENV !== 'test') {
    console.error('[campuscare] unhandled error', error);
  }

  res.status(500).json(buildErrorBody('INTERNAL', message, { messageKey: 'internal' }));
};
