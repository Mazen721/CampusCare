import {
  Archive,
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
  labelKey: string;
  to: string;
  icon: LucideIcon;
  end?: boolean;
  /** Route ships in a later day; rendered as a non-interactive "Soon" item. */
  soon?: boolean;
}

export interface NavigationGroup {
  titleKey: string;
  items: NavigationItem[];
}

const WORKSPACE_ITEMS: Record<Role, NavigationItem[]> = {
  STUDENT_EMPLOYEE: [
    { labelKey: 'nav.newRequest', to: '/maintenance/requests/new', icon: PlusCircle },
    { labelKey: 'nav.myRequests', to: '/maintenance/requests', icon: ClipboardList, end: true },
    { labelKey: 'nav.reportLostFound', to: '/lost-found/report', icon: PackagePlus },
    { labelKey: 'nav.browseLostFound', to: '/lost-found', icon: Search, end: true },
    { labelKey: 'nav.myClaims', to: '/lost-found/claims', icon: BadgeCheck },
    { labelKey: 'nav.myReports', to: '/lost-found/my-reports', icon: FolderSearch },
  ],
  TECHNICIAN: [
    { labelKey: 'nav.myWorkOrders', to: '/work-orders', icon: Wrench },
    { labelKey: 'nav.mySchedule', to: '/maintenance/calendar', icon: CalendarDays },
  ],
  MAINTENANCE_MANAGER: [
    { labelKey: 'nav.requestQueue', to: '/maintenance/request-queue', icon: Inbox },
    { labelKey: 'nav.workOrders', to: '/work-orders', icon: ClipboardCheck },
    { labelKey: 'nav.technicians', to: '/technicians', icon: UsersRound },
    { labelKey: 'nav.calendar', to: '/maintenance/calendar', icon: CalendarDays },
    { labelKey: 'nav.preventive', to: '/maintenance/preventive', icon: Repeat2 },
    { labelKey: 'nav.feedback', to: '/maintenance/feedback', icon: Star },
  ],
  LOST_FOUND_OFFICER: [
    { labelKey: 'nav.allReports', to: '/lost-found/items', icon: Files },
    { labelKey: 'nav.archivedItems', to: '/lost-found/archived', icon: Archive },
    { labelKey: 'nav.matches', to: '/lost-found/matches', icon: GitCompareArrows },
    { labelKey: 'nav.claims', to: '/lost-found/claims', icon: ShieldCheck },
    { labelKey: 'nav.handovers', to: '/lost-found/handovers', icon: Handshake },
  ],
  SUPER_ADMIN: [
    { labelKey: 'nav.users', to: '/users', icon: Users },
    { labelKey: 'nav.locations', to: '/locations', icon: MapPin },
    { labelKey: 'nav.activityLogs', to: '/activity-logs', icon: ScrollText },
    { labelKey: 'nav.maintenanceView', to: '/maintenance/requests', icon: Eye },
    { labelKey: 'nav.lostFoundView', to: '/lost-found/items', icon: Eye },
  ],
};

export function getNavigation(role: Role): NavigationGroup[] {
  return [
    {
      titleKey: 'nav.groupOverview',
      items: [
        { labelKey: 'nav.dashboard', to: '/dashboard', icon: LayoutDashboard, end: true },
      ],
    },
    {
      titleKey: 'nav.groupWorkspace',
      items: WORKSPACE_ITEMS[role],
    },
    {
      titleKey: 'nav.groupAccount',
      items: [{ labelKey: 'nav.profile', to: '/profile', icon: UserRound }],
    },
  ];
}
