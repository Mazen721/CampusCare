import type { LucideIcon } from 'lucide-react';
import {
  BadgeCheck,
  Building2,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  Eye,
  FileSearch,
  GitCompareArrows,
  Handshake,
  KeyRound,
  MapPinned,
  PackageSearch,
  ScrollText,
  ShieldCheck,
  UserCog,
  Users,
  Wrench,
} from 'lucide-react';
import type { Role } from '@/types/auth';

export interface RoleCapability {
  labelKey: string;
  descriptionKey: string;
  icon: LucideIcon;
}

export interface RoleOverview {
  summaryKey: string;
  scopeKey: string;
  capabilities: RoleCapability[];
}

export const ROLE_OVERVIEWS: Record<Role, RoleOverview> = {
  SUPER_ADMIN: {
    summaryKey: 'dashboard.roles.SUPER_ADMIN.summary',
    scopeKey: 'dashboard.roles.SUPER_ADMIN.scope',
    capabilities: [
      {
        labelKey: 'dashboard.roles.SUPER_ADMIN.cap1Label',
        descriptionKey: 'dashboard.roles.SUPER_ADMIN.cap1Desc',
        icon: UserCog,
      },
      {
        labelKey: 'dashboard.roles.SUPER_ADMIN.cap2Label',
        descriptionKey: 'dashboard.roles.SUPER_ADMIN.cap2Desc',
        icon: MapPinned,
      },
      {
        labelKey: 'dashboard.roles.SUPER_ADMIN.cap3Label',
        descriptionKey: 'dashboard.roles.SUPER_ADMIN.cap3Desc',
        icon: ScrollText,
      },
      {
        labelKey: 'dashboard.roles.SUPER_ADMIN.cap4Label',
        descriptionKey: 'dashboard.roles.SUPER_ADMIN.cap4Desc',
        icon: Eye,
      },
    ],
  },
  MAINTENANCE_MANAGER: {
    summaryKey: 'dashboard.roles.MAINTENANCE_MANAGER.summary',
    scopeKey: 'dashboard.roles.MAINTENANCE_MANAGER.scope',
    capabilities: [
      {
        labelKey: 'dashboard.roles.MAINTENANCE_MANAGER.cap1Label',
        descriptionKey: 'dashboard.roles.MAINTENANCE_MANAGER.cap1Desc',
        icon: ClipboardCheck,
      },
      {
        labelKey: 'dashboard.roles.MAINTENANCE_MANAGER.cap2Label',
        descriptionKey: 'dashboard.roles.MAINTENANCE_MANAGER.cap2Desc',
        icon: Wrench,
      },
      {
        labelKey: 'dashboard.roles.MAINTENANCE_MANAGER.cap3Label',
        descriptionKey: 'dashboard.roles.MAINTENANCE_MANAGER.cap3Desc',
        icon: CalendarDays,
      },
      {
        labelKey: 'dashboard.roles.MAINTENANCE_MANAGER.cap4Label',
        descriptionKey: 'dashboard.roles.MAINTENANCE_MANAGER.cap4Desc',
        icon: BadgeCheck,
      },
    ],
  },
  TECHNICIAN: {
    summaryKey: 'dashboard.roles.TECHNICIAN.summary',
    scopeKey: 'dashboard.roles.TECHNICIAN.scope',
    capabilities: [
      {
        labelKey: 'dashboard.roles.TECHNICIAN.cap1Label',
        descriptionKey: 'dashboard.roles.TECHNICIAN.cap1Desc',
        icon: Wrench,
      },
      {
        labelKey: 'dashboard.roles.TECHNICIAN.cap2Label',
        descriptionKey: 'dashboard.roles.TECHNICIAN.cap2Desc',
        icon: ClipboardList,
      },
      {
        labelKey: 'dashboard.roles.TECHNICIAN.cap3Label',
        descriptionKey: 'dashboard.roles.TECHNICIAN.cap3Desc',
        icon: CalendarDays,
      },
      {
        labelKey: 'dashboard.roles.TECHNICIAN.cap4Label',
        descriptionKey: 'dashboard.roles.TECHNICIAN.cap4Desc',
        icon: FileSearch,
      },
    ],
  },
  LOST_FOUND_OFFICER: {
    summaryKey: 'dashboard.roles.LOST_FOUND_OFFICER.summary',
    scopeKey: 'dashboard.roles.LOST_FOUND_OFFICER.scope',
    capabilities: [
      {
        labelKey: 'dashboard.roles.LOST_FOUND_OFFICER.cap1Label',
        descriptionKey: 'dashboard.roles.LOST_FOUND_OFFICER.cap1Desc',
        icon: PackageSearch,
      },
      {
        labelKey: 'dashboard.roles.LOST_FOUND_OFFICER.cap2Label',
        descriptionKey: 'dashboard.roles.LOST_FOUND_OFFICER.cap2Desc',
        icon: GitCompareArrows,
      },
      {
        labelKey: 'dashboard.roles.LOST_FOUND_OFFICER.cap3Label',
        descriptionKey: 'dashboard.roles.LOST_FOUND_OFFICER.cap3Desc',
        icon: ShieldCheck,
      },
      {
        labelKey: 'dashboard.roles.LOST_FOUND_OFFICER.cap4Label',
        descriptionKey: 'dashboard.roles.LOST_FOUND_OFFICER.cap4Desc',
        icon: Handshake,
      },
    ],
  },
  STUDENT_EMPLOYEE: {
    summaryKey: 'dashboard.roles.STUDENT_EMPLOYEE.summary',
    scopeKey: 'dashboard.roles.STUDENT_EMPLOYEE.scope',
    capabilities: [
      {
        labelKey: 'dashboard.roles.STUDENT_EMPLOYEE.cap1Label',
        descriptionKey: 'dashboard.roles.STUDENT_EMPLOYEE.cap1Desc',
        icon: ClipboardList,
      },
      {
        labelKey: 'dashboard.roles.STUDENT_EMPLOYEE.cap2Label',
        descriptionKey: 'dashboard.roles.STUDENT_EMPLOYEE.cap2Desc',
        icon: ClipboardCheck,
      },
      {
        labelKey: 'dashboard.roles.STUDENT_EMPLOYEE.cap3Label',
        descriptionKey: 'dashboard.roles.STUDENT_EMPLOYEE.cap3Desc',
        icon: PackageSearch,
      },
      {
        labelKey: 'dashboard.roles.STUDENT_EMPLOYEE.cap4Label',
        descriptionKey: 'dashboard.roles.STUDENT_EMPLOYEE.cap4Desc',
        icon: BadgeCheck,
      },
    ],
  },
};

export const ACCOUNT_ICONS = {
  building: Building2,
  calendar: CalendarDays,
  key: KeyRound,
  users: Users,
} as const;
