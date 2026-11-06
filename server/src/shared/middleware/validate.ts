import type { Request, RequestHandler } from 'express';
import type { ZodTypeAny } from 'zod';

export type ValidationSource = 'body' | 'query' | 'params';

/**
 * Parses and replaces the selected request segment with validated data.
 * Validation failures flow to the central error handler as a ZodError (400).
 */
export function validate<T extends ZodTypeAny>(
  schema: T,
  source: ValidationSource = 'body',
): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      next(result.error);
      return;
    }

    if (source === 'body') {
      req.body = result.data;
    } else if (source === 'query') {
      req.query = result.data as Request['query'];
    } else {
      req.params = result.data as Request['params'];
    }

    next();
  };
}
