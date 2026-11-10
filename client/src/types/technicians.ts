import type { TechnicianAvailability } from '@/types/auth';
import type { MaintenanceCategory } from '@/types/meta';

export interface TechnicianActiveTask {
  id: string;
  workOrderNumber: string;
  title: string;
  titleAr?: string;
  priority: string;
  status: string;
  category: string;
  scheduledStart?: string;
  expectedCompletion?: string;
  actualStart?: string;
  location?: {
    id: string;
    buildingName: string;
    buildingNameAr?: string;
    floor: string;
    floorAr?: string;
    room: string;
    roomAr?: string;
  } | null;
}

export interface TechnicianRecord {
  id: string;
  name: string;
  nameAr?: string;
  email: string;
  role: 'TECHNICIAN';
  department?: string;
  departmentAr?: string;
  contactPhone?: string;
  isActive: boolean;
  specializations: MaintenanceCategory[];
  skills: string[];
  skillsAr?: string[];
  availability: TechnicianAvailability;
  createdAt: string;
  activeWorkOrderCount: number;
  completedWorkOrderCount: number;
  averageRating: number | null;
  averageResolutionHours: number | null;
  matchesCategory?: boolean;
}

export interface TechnicianDetailRecord extends TechnicianRecord {
  activeTasks: TechnicianActiveTask[];
}

export interface CreateTechnicianInput {
  name: string;
  nameAr?: string;
  email: string;
  password: string;
  department?: string;
  departmentAr?: string;
  contactPhone?: string;
  specializations: MaintenanceCategory[];
  skills: string[];
  skillsAr?: string[];
  availability: TechnicianAvailability;
  isActive?: boolean;
}

export interface UpdateTechnicianInput {
  name?: string;
  nameAr?: string;
  email?: string;
  password?: string;
  department?: string;
  departmentAr?: string;
  contactPhone?: string;
  specializations?: MaintenanceCategory[];
  skills?: string[];
  skillsAr?: string[];
  availability?: TechnicianAvailability;
  isActive?: boolean;
}

export interface ListTechniciansParams {
  category?: MaintenanceCategory;
  page?: number;
  limit?: number;
}
