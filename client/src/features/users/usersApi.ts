import { api } from '@/lib/api';
import { toQueryString } from '@/lib/queryString';
import type { PaginatedResponse } from '@/types/api';
import type { Role } from '@/types/auth';
import type {
  CreateUserInput,
  UpdateUserInput,
  UserRecord,
} from '@/types/users';

export interface ListUsersParams {
  q?: string;
  role?: Role;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export const usersApi = {
  list(params: ListUsersParams = {}): Promise<PaginatedResponse<UserRecord>> {
    return api.get<PaginatedResponse<UserRecord>>(`/users${toQueryString(params)}`);
  },
  get(id: string): Promise<{ user: UserRecord }> {
    return api.get<{ user: UserRecord }>(`/users/${id}`);
  },
  create(input: CreateUserInput): Promise<{ user: UserRecord }> {
    return api.post<{ user: UserRecord }>('/users', input);
  },
  update(id: string, input: UpdateUserInput): Promise<{ user: UserRecord }> {
    return api.patch<{ user: UserRecord }>(`/users/${id}`, input);
  },
  updateStatus(id: string, isActive: boolean): Promise<{ user: UserRecord }> {
    return api.patch<{ user: UserRecord }>(`/users/${id}/status`, { isActive });
  },
};
