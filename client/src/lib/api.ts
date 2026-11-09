import i18n, { getLang } from '@/i18n';
import { resolveParams } from '@/i18n/localize';
import type {
  AuthResponse,
  ChangePasswordInput,
  LoginCredentials,
  Role,
} from '@/types/auth';

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api/v1').replace(/\/$/, '');
export const TOKEN_STORAGE_KEY = 'campuscare.token';
export const UNAUTHORIZED_EVENT = 'campuscare:unauthorized';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly messageKey?: string;
  readonly params?: Record<string, string | number>;
  readonly details?: unknown;

  constructor(
    message: string,
    status = 0,
    code = 'REQUEST_FAILED',
    details?: unknown,
    messageKey?: string,
    params?: Record<string, string | number>,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.messageKey = messageKey;
    this.params = params;
  }
}

interface ApiErrorBody {
  error?: {
    code?: string;
    message?: string;
    messageKey?: string;
    params?: Record<string, string | number>;
    details?: unknown;
  };
}

export function getErrorMessage(err: unknown, defaultMessage?: string): string {
  if (err instanceof ApiError && err.messageKey) {
    const key = `serverErrors.${err.messageKey}`;
    const localized = i18n.t(key, {
      ...resolveParams(err.params),
      defaultValue: err.message,
    });
    if (localized && localized !== key) {
      return localized;
    }
  }
  if (err instanceof Error) {
    return err.message;
  }
  return defaultMessage ?? i18n.t('errors.generic');
}

export function getStoredToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function storeToken(token: string): void {
  window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearStoredToken(): void {
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export function isDemoModeEnabled(): boolean {
  return import.meta.env.VITE_DEMO_MODE === 'true';
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  dispatchUnauthorized?: boolean;
  headers?: HeadersInit;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, dispatchUnauthorized = true, headers } = options;
  const requestHeaders = new Headers(headers);
  requestHeaders.set('Accept-Language', getLang());
  const token = getStoredToken();

  if (token) {
    requestHeaders.set('Authorization', `Bearer ${token}`);
  }

  let payloadBody: BodyInit | undefined;
  if (body instanceof FormData) {
    payloadBody = body;
  } else if (body !== undefined) {
    requestHeaders.set('Content-Type', 'application/json');
    payloadBody = JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: requestHeaders,
      body: payloadBody,
    });
  } catch {
    throw new ApiError(
      i18n.t('errors.network'),
      0,
      'NETWORK_ERROR',
    );
  }

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text) as unknown;
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    const errorBody = payload as ApiErrorBody | null;

    if (response.status === 401 && dispatchUnauthorized) {
      clearStoredToken();
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }

    throw new ApiError(
      errorBody?.error?.message ?? i18n.t('errors.requestFailed', { status: response.status }),
      response.status,
      errorBody?.error?.code ?? 'REQUEST_FAILED',
      errorBody?.error?.details,
      errorBody?.error?.messageKey,
      errorBody?.error?.params,
    );
  }

  return payload as T;
}

export const api = {
  get<T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return request<T>(path, { ...options, method: 'GET' });
  },
  post<T>(
    path: string,
    body?: unknown,
    options?: Omit<RequestOptions, 'method' | 'body'>,
  ): Promise<T> {
    return request<T>(path, { ...options, method: 'POST', body });
  },
  patch<T>(
    path: string,
    body?: unknown,
    options?: Omit<RequestOptions, 'method' | 'body'>,
  ): Promise<T> {
    return request<T>(path, { ...options, method: 'PATCH', body });
  },
  delete<T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return request<T>(path, { ...options, method: 'DELETE' });
  },
};

export const authApi = {
  login(credentials: LoginCredentials): Promise<AuthResponse> {
    return request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: credentials,
      dispatchUnauthorized: false,
    });
  },
  demoLogin(role: Role): Promise<AuthResponse> {
    return request<AuthResponse>('/auth/demo-login', {
      method: 'POST',
      body: { role },
      dispatchUnauthorized: false,
    });
  },
  me(): Promise<{ user: AuthResponse['user'] }> {
    return request<{ user: AuthResponse['user'] }>('/auth/me');
  },
  changePassword(input: ChangePasswordInput): Promise<{ message: string; messageKey?: string }> {
    return request<{ message: string; messageKey?: string }>('/auth/change-password', {
      method: 'PATCH',
      body: input,
    });
  },
};

/**
 * Reads the JWT expiry client-side for the session card. This is display-only;
 * the server always verifies the token.
 */
export function getTokenExpiry(): Date | null {
  const token = getStoredToken();
  if (!token) return null;

  const [, encodedPayload] = token.split('.');
  if (!encodedPayload) return null;

  try {
    const normalized = encodedPayload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    const payload = JSON.parse(window.atob(padded)) as { exp?: unknown };
    if (typeof payload.exp !== 'number') return null;
    return new Date(payload.exp * 1000);
  } catch {
    return null;
  }
}
