export interface PaginatedResult<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export function parsePagination(
  query: { page?: unknown; limit?: unknown },
  defaults: Partial<PaginationParams> = {},
): PaginationParams {
  const rawPage = Number(query.page ?? defaults.page ?? DEFAULT_PAGE);
  const rawLimit = Number(query.limit ?? defaults.limit ?? DEFAULT_LIMIT);

  const page = Number.isFinite(rawPage) ? Math.max(1, Math.trunc(rawPage)) : DEFAULT_PAGE;
  const limit = Number.isFinite(rawLimit)
    ? Math.min(MAX_LIMIT, Math.max(1, Math.trunc(rawLimit)))
    : DEFAULT_LIMIT;

  return { page, limit };
}

export function paginate<T>(
  data: T[],
  page: number,
  limit: number,
  total: number,
): PaginatedResult<T> {
  return { data, page, limit, total };
}
