import { api } from '@/lib/api';
import { toQueryString } from '@/lib/queryString';
import type { PaginatedResponse } from '@/types/api';
import type {
  CreateTechnicianInput,
  ListTechniciansParams,
  TechnicianDetailRecord,
  TechnicianRecord,
  UpdateTechnicianInput,
} from '@/types/technicians';

export const techniciansApi = {
  list(params: ListTechniciansParams = {}): Promise<PaginatedResponse<TechnicianRecord>> {
    return api.get<PaginatedResponse<TechnicianRecord>>(`/technicians${toQueryString(params)}`);
  },

  get(id: string): Promise<TechnicianDetailRecord> {
    return api
      .get<{ technician: TechnicianDetailRecord }>(`/technicians/${id}`)
      .then((res: { technician: TechnicianDetailRecord }) => res.technician);
  },

  create(input: CreateTechnicianInput): Promise<TechnicianRecord> {
    return api
      .post<{ technician: TechnicianRecord }>('/technicians', input)
      .then((res: { technician: TechnicianRecord }) => res.technician);
  },

  update(id: string, input: UpdateTechnicianInput): Promise<TechnicianRecord> {
    return api
      .patch<{ technician: TechnicianRecord }>(`/technicians/${id}`, input)
      .then((res: { technician: TechnicianRecord }) => res.technician);
  },
};
