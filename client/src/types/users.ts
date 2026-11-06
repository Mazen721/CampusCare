import type { AuthUser, TechnicianAvailability } from '@/types/auth';
import type { MaintenanceCategory } from '@/types/meta';

export type UserRecord = AuthUser;

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: AuthUser['role'];
  department?: string;
  contactPhone?: string;
  specializations?: MaintenanceCategory[];
  skills?: string[];
  availability?: TechnicianAvailability;
}

export type UpdateUserInput = Partial<Omit<CreateUserInput, 'password'>>;
