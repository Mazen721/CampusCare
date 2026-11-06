export type QueryValue = string | number | boolean | null | undefined;

/**
 * Serialises defined, non-empty query values into a `?a=b` suffix.
 */
export function toQueryString<T extends object>(params: T): string {
  const search = new URLSearchParams();
  const entries = Object.entries(params) as Array<[string, QueryValue]>;

  entries.forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    search.set(key, String(value));
  });

  const serialised = search.toString();
  return serialised ? `?${serialised}` : '';
}
