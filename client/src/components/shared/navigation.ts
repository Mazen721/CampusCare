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
    { label: 'Report lost / found', to: '/lost-found/report', icon: PackagePlus, soon: true },
    { label: 'Browse lost & found', to: '/lost-found', icon: Search, soon: true },
    { label: 'My claims', to: '/lost-found/claims', icon: BadgeCheck, soon: true },
    { label: 'My reports', to: '/lost-found/my-reports', icon: FolderSearch, soon: true },
  ],
  TECHNICIAN: [
    { label: 'My work orders', to: '/work-orders', icon: Wrench, soon: true },
    { label: 'My schedule', to: '/maintenance/calendar', icon: CalendarDays, soon: true },
  ],
  MAINTENANCE_MANAGER: [
    { label: 'Request queue', to: '/maintenance/request-queue', icon: Inbox },
    { label: 'Work orders', to: '/work-orders', icon: ClipboardCheck, soon: true },
    { label: 'Technicians', to: '/technicians', icon: UsersRound, soon: true },
    { label: 'Calendar', to: '/maintenance/calendar', icon: CalendarDays, soon: true },
    { label: 'Preventive plans', to: '/maintenance/preventive', icon: Repeat2, soon: true },
    { label: 'Feedback', to: '/maintenance/feedback', icon: Star, soon: true },
  ],
  LOST_FOUND_OFFICER: [
    { label: 'All reports', to: '/lost-found/items', icon: Files, soon: true },
    { label: 'Match suggestions', to: '/lost-found/matches', icon: GitCompareArrows, soon: true },
    { label: 'Claims', to: '/lost-found/claims', icon: ShieldCheck, soon: true },
    { label: 'Handovers', to: '/lost-found/handovers', icon: Handshake, soon: true },
  ],
  SUPER_ADMIN: [
    { label: 'Users', to: '/users', icon: Users },
    { label: 'Locations', to: '/locations', icon: MapPin },
    { label: 'Activity logs', to: '/activity-logs', icon: ScrollText, soon: true },
    { label: 'Maintenance view', to: '/maintenance/requests', icon: Eye },
    { label: 'Lost & Found view', to: '/lost-found/items', icon: Eye, soon: true },
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
