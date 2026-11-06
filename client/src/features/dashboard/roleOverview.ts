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
  label: string;
  description: string;
  icon: LucideIcon;
}

export interface RoleOverview {
  summary: string;
  capabilities: RoleCapability[];
}

export const ROLE_OVERVIEWS: Record<Role, RoleOverview> = {
  SUPER_ADMIN: {
    summary:
      'You keep the platform running: manage people and campus locations, audit activity, and see every record in both modules without changing operational state.',
    capabilities: [
      {
        label: 'Manage user accounts',
        description: 'Create, edit, activate and deactivate any account across the five roles.',
        icon: UserCog,
      },
      {
        label: 'Own the location registry',
        description: 'Maintain buildings, floors and rooms used by both modules.',
        icon: MapPinned,
      },
      {
        label: 'Audit every action',
        description: 'Read the immutable activity log filtered by actor, entity or date.',
        icon: ScrollText,
      },
      {
        label: 'Oversee both modules',
        description: 'View all maintenance and lost & found records in a read-only capacity.',
        icon: Eye,
      },
    ],
  },
  MAINTENANCE_MANAGER: {
    summary:
      'You run the maintenance workflow end to end: review incoming requests, assign the right technician, keep the schedule moving and close the loop with feedback.',
    capabilities: [
      {
        label: 'Review and approve requests',
        description: 'Approve or reject submitted requests, with notes required for a rejection.',
        icon: ClipboardCheck,
      },
      {
        label: 'Assign work orders',
        description: 'Assign, reassign or cancel work orders and balance technician workload.',
        icon: Wrench,
      },
      {
        label: 'Plan preventive work',
        description: 'Manage preventive plans, generate due work orders and keep the calendar current.',
        icon: CalendarDays,
      },
      {
        label: 'Track performance',
        description: 'Follow completion, overdue work and feedback trends across the team.',
        icon: BadgeCheck,
      },
    ],
  },
  TECHNICIAN: {
    summary:
      'You focus on the work assigned to you. Start jobs, record progress notes, complete work orders and keep your schedule visible to the maintenance team.',
    capabilities: [
      {
        label: 'See your assigned work',
        description: 'Open only the work orders assigned to you, including location and priority.',
        icon: Wrench,
      },
      {
        label: 'Record progress',
        description: 'Start a job, add notes and complete the work order with the repair outcome.',
        icon: ClipboardList,
      },
      {
        label: 'Keep your schedule',
        description: 'View your own calendar of scheduled and preventive work.',
        icon: CalendarDays,
      },
      {
        label: 'Use AI summaries',
        description: 'Generate an AI summary for work orders assigned to you.',
        icon: FileSearch,
      },
    ],
  },
  LOST_FOUND_OFFICER: {
    summary:
      'You reunite people with their belongings: review reports, confirm matches, verify ownership privately and record every handover.',
    capabilities: [
      {
        label: 'Review all reports',
        description: 'See every lost and found report, including private identification details.',
        icon: PackageSearch,
      },
      {
        label: 'Confirm match suggestions',
        description: 'Confirm strong matches or dismiss suggestions that do not fit.',
        icon: GitCompareArrows,
      },
      {
        label: 'Verify claims',
        description: 'Review ownership evidence and approve or reject claims.',
        icon: ShieldCheck,
      },
      {
        label: 'Record handovers',
        description: 'Capture the handover details when an item is returned to its owner.',
        icon: Handshake,
      },
    ],
  },
  STUDENT_EMPLOYEE: {
    summary:
      'Your campus, sorted. Report maintenance issues, follow their progress, and use lost & found to report, search and claim belongings.',
    capabilities: [
      {
        label: 'Report maintenance issues',
        description: 'Submit a request with photos, category, priority and an exact location.',
        icon: ClipboardList,
      },
      {
        label: 'Track your requests',
        description: 'Follow progress, confirm completed work, reopen an issue or leave feedback.',
        icon: ClipboardCheck,
      },
      {
        label: 'Report and browse lost & found',
        description: 'File lost or found reports and search public listings.',
        icon: PackageSearch,
      },
      {
        label: 'Submit and track claims',
        description: 'Claim an item you recognise and follow the verification decision.',
        icon: BadgeCheck,
      },
    ],
  },
};

export const ROLE_SCOPE: Record<Role, string> = {
  SUPER_ADMIN: 'All users · all locations · both modules',
  MAINTENANCE_MANAGER: 'All maintenance requests · technician records',
  TECHNICIAN: 'Work orders assigned to you · your schedule',
  LOST_FOUND_OFFICER: 'All lost & found reports · claims · handovers',
  STUDENT_EMPLOYEE: 'Your own requests · reports · claims',
};

export const ACCOUNT_ICONS = {
  building: Building2,
  calendar: CalendarDays,
  key: KeyRound,
  users: Users,
} as const;
