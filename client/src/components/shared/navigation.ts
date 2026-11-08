import {
  BadgeCheck,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  Eye,
  Files,
  FolderSearch,
  GitCompareArrows,
  Handshake,
  Inbox,
  LayoutDashboard,
  MapPin,
  PackagePlus,
  PlusCircle,
  Repeat2,
  ScrollText,
  Search,
  ShieldCheck,
  Star,
  UserRound,
  Users,
  UsersRound,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import type { Role } from '@/types/auth';

export interface NavigationItem {
  label: string;
  to: string;
  icon: LucideIcon;
  end?: boolean;
  /** Route ships in a later day; rendered as a non-interactive "Soon" item. */
  soon?: boolean;
}

export interface NavigationGroup {
  title: string;
  items: NavigationItem[];
}

const WORKSPACE_ITEMS: Record<Role, NavigationItem[]> = {
  STUDENT_EMPLOYEE: [
    { label: 'New request', to: '/maintenance/requests/new', icon: PlusCircle },
    { label: 'My requests', to: '/maintenance/requests', icon: ClipboardList, end: true },
    { label: 'Report lost / found', to: '/lost-found/report', icon: PackagePlus },
    { label: 'Browse lost & found', to: '/lost-found', icon: Search },
    { label: 'My claims', to: '/lost-found/claims', icon: BadgeCheck },
    { label: 'My reports', to: '/lost-found/my-reports', icon: FolderSearch },
  ],
  TECHNICIAN: [
    { label: 'My work orders', to: '/work-orders', icon: Wrench },
    { label: 'My schedule', to: '/maintenance/calendar', icon: CalendarDays },
  ],
  MAINTENANCE_MANAGER: [
    { label: 'Request queue', to: '/maintenance/request-queue', icon: Inbox },
    { label: 'Work orders', to: '/work-orders', icon: ClipboardCheck },
    { label: 'Technicians', to: '/technicians', icon: UsersRound },
    { label: 'Calendar', to: '/maintenance/calendar', icon: CalendarDays },
    { label: 'Preventive plans', to: '/maintenance/preventive', icon: Repeat2 },
    { label: 'Feedback', to: '/maintenance/feedback', icon: Star },
  ],
  LOST_FOUND_OFFICER: [
    { label: 'All reports', to: '/lost-found/items', icon: Files },
    { label: 'Match suggestions', to: '/lost-found/matches', icon: GitCompareArrows },
    { label: 'Claims', to: '/lost-found/claims', icon: ShieldCheck },
    { label: 'Handovers', to: '/lost-found/handovers', icon: Handshake },
  ],
  SUPER_ADMIN: [
    { label: 'Users', to: '/users', icon: Users },
    { label: 'Locations', to: '/locations', icon: MapPin },
    { label: 'Activity logs', to: '/activity-logs', icon: ScrollText },
    { label: 'Maintenance view', to: '/maintenance/requests', icon: Eye },
    { label: 'Lost & Found view', to: '/lost-found/items', icon: Eye },
  ],
};

export function getNavigation(role: Role): NavigationGroup[] {
  return [
    {
      title: 'Overview',
      items: [
        { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, end: true },
      ],
    },
    {
      title: 'Workspace',
      items: WORKSPACE_ITEMS[role],
    },
    {
      title: 'Account',
      items: [{ label: 'Profile', to: '/profile', icon: UserRound }],
    },
  ];
}
