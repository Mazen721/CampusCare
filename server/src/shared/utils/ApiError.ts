export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly messageKey?: string;
  readonly params?: Record<string, string | number>;
  readonly details?: unknown;

  // Exception to parameter count limit: ApiError constructor preserves legacy (statusCode, code, message) positional contract while supporting (messageKey, params, details) as specified in Phase 5 plan.
  // Revisit trigger: Refactor ApiError constructor to use an options object { statusCode, code, message, messageKey?, params?, details? } when breaking change across call sites is scheduled.
  constructor(
    statusCode: number,
    code: string,
    message: string,
    messageKey?: string,
    params?: Record<string, string | number>,
    details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.messageKey = messageKey;
    this.params = params;
    this.details = details;
    Error.captureStackTrace?.(this, ApiError);
  }

  static badRequest(
    message: string,
    messageKey?: string,
    params?: Record<string, string | number>,
    details?: unknown,
  ): ApiError {
    return new ApiError(400, 'BAD_REQUEST', message, messageKey, params, details);
  }

  static unauthorized(
    message = 'Authentication required',
    messageKey = 'unauthorized',
    params?: Record<string, string | number>,
  ): ApiError {
    return new ApiError(401, 'UNAUTHORIZED', message, messageKey, params);
  }

  static forbidden(
    message = 'You do not have permission to perform this action',
    messageKey = 'forbidden',
    params?: Record<string, string | number>,
  ): ApiError {
    return new ApiError(403, 'FORBIDDEN', message, messageKey, params);
  }

  static notFound(
    message = 'Resource not found',
    messageKey = 'notFound',
    params?: Record<string, string | number>,
  ): ApiError {
    return new ApiError(404, 'NOT_FOUND', message, messageKey, params);
  }

  static conflict(
    message: string,
    messageKey?: string,
    params?: Record<string, string | number>,
    details?: unknown,
  ): ApiError {
    return new ApiError(409, 'CONFLICT', message, messageKey, params, details);
  }
}
