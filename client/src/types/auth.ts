export const ROLES = [
  'SUPER_ADMIN',
  'MAINTENANCE_MANAGER',
  'TECHNICIAN',
  'LOST_FOUND_OFFICER',
  'STUDENT_EMPLOYEE',
] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: 'Super Admin',
  MAINTENANCE_MANAGER: 'Maintenance Manager',
  TECHNICIAN: 'Technician',
  LOST_FOUND_OFFICER: 'Lost & Found Officer',
  STUDENT_EMPLOYEE: 'Student / Employee',
};

export const ROLE_SHORT_LABELS: Record<Role, string> = {
  SUPER_ADMIN: 'Admin',
  MAINTENANCE_MANAGER: 'Manager',
  TECHNICIAN: 'Technician',
  LOST_FOUND_OFFICER: 'Officer',
  STUDENT_EMPLOYEE: 'Student',
};

export type TechnicianAvailability = 'AVAILABLE' | 'BUSY' | 'OFF_DUTY';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  department?: string;
  contactPhone?: string;
  isActive: boolean;
  specializations: string[];
  skills: string[];
  availability?: TechnicianAvailability;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}
