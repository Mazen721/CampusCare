import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Meta } from '@/types/meta';

export const META_QUERY_KEY = ['meta'] as const;

export function useMeta() {
  return useQuery({
    queryKey: META_QUERY_KEY,
    queryFn: () => api.get<Meta>('/meta'),
    staleTime: 10 * 60 * 1000,
  });
}
