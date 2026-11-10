import {
  Archive,
  BadgeCheck,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  Files,
  FolderSearch,
  GitCompareArrows,
  Handshake,
  Inbox,
  LayoutDashboard,
  MapPin,
  PackagePlus,
  PackageSearch,
  PlusCircle,
  Repeat2,
  ScrollText,
  Search,
  ShieldCheck,
  Star,
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

const STUDENT_NAVIGATION: NavigationGroup[] = [
  {
    titleKey: 'nav.groupOverview',
    items: [
      { labelKey: 'nav.dashboard', to: '/dashboard', icon: LayoutDashboard, end: true },
    ],
  },
  {
    titleKey: 'nav.maintenance',
    items: [
      { labelKey: 'nav.reportIssue', to: '/maintenance/requests/new', icon: PlusCircle },
      { labelKey: 'nav.myRequests', to: '/maintenance/requests', icon: ClipboardList, end: true },
    ],
  },
  {
    titleKey: 'nav.lostFound',
    items: [
      { labelKey: 'nav.reportItem', to: '/lost-found/report', icon: PackagePlus },
      { labelKey: 'nav.browseLostFound', to: '/lost-found', icon: Search, end: true },
      { labelKey: 'nav.myClaims', to: '/lost-found/claims', icon: BadgeCheck },
      { labelKey: 'nav.myReports', to: '/lost-found/my-reports', icon: FolderSearch },
    ],
  },
];

const OFFICER_NAVIGATION: NavigationGroup[] = [
  {
    titleKey: 'nav.groupOverview',
    items: [
      { labelKey: 'nav.dashboard', to: '/dashboard', icon: LayoutDashboard, end: true },
    ],
  },
  {
    titleKey: 'nav.groupTriageVerification',
    items: [
      { labelKey: 'nav.matches', to: '/lost-found/matches', icon: GitCompareArrows },
      { labelKey: 'nav.claims', to: '/lost-found/claims', icon: ShieldCheck },
      { labelKey: 'nav.handovers', to: '/lost-found/handovers', icon: Handshake },
    ],
  },
  {
    titleKey: 'nav.groupItemRegistry',
    items: [
      { labelKey: 'nav.allReports', to: '/lost-found/items', icon: Files, end: true },
      { labelKey: 'nav.archivedItems', to: '/lost-found/archived', icon: Archive },
    ],
  },
];

const TECHNICIAN_NAVIGATION: NavigationGroup[] = [
  {
    titleKey: 'nav.groupOverview',
    items: [
      { labelKey: 'nav.dashboard', to: '/dashboard', icon: LayoutDashboard, end: true },
    ],
  },
  {
    titleKey: 'nav.groupFieldOperations',
    items: [
      { labelKey: 'nav.myWorkOrders', to: '/work-orders', icon: Wrench },
      { labelKey: 'nav.mySchedule', to: '/maintenance/calendar', icon: CalendarDays },
    ],
  },
];

const MANAGER_NAVIGATION: NavigationGroup[] = [
  {
    titleKey: 'nav.groupOverview',
    items: [
      { labelKey: 'nav.dashboard', to: '/dashboard', icon: LayoutDashboard, end: true },
    ],
  },
  {
    titleKey: 'nav.groupTriageDispatch',
    items: [
      { labelKey: 'nav.requestQueue', to: '/maintenance/request-queue', icon: Inbox },
      { labelKey: 'nav.workOrders', to: '/work-orders', icon: ClipboardCheck },
      { labelKey: 'nav.technicians', to: '/technicians', icon: UsersRound },
    ],
  },
  {
    titleKey: 'nav.groupPlanningQuality',
    items: [
      { labelKey: 'nav.calendar', to: '/maintenance/calendar', icon: CalendarDays },
      { labelKey: 'nav.preventive', to: '/maintenance/preventive', icon: Repeat2 },
      { labelKey: 'nav.feedback', to: '/maintenance/feedback', icon: Star },
    ],
  },
];

const ADMIN_NAVIGATION: NavigationGroup[] = [
  {
    titleKey: 'nav.groupOverview',
    items: [
      { labelKey: 'nav.dashboard', to: '/dashboard', icon: LayoutDashboard, end: true },
    ],
  },
  {
    titleKey: 'nav.groupGovernanceDirectory',
    items: [
      { labelKey: 'nav.users', to: '/users', icon: Users },
      { labelKey: 'nav.locations', to: '/locations', icon: MapPin },
      { labelKey: 'nav.activityLogs', to: '/activity-logs', icon: ScrollText },
    ],
  },
  {
    titleKey: 'nav.groupCampusOversight',
    items: [
      { labelKey: 'nav.maintenanceView', to: '/maintenance/requests', icon: ClipboardList },
      { labelKey: 'nav.lostFoundView', to: '/lost-found/items', icon: PackageSearch },
    ],
  },
];

const MNU_PORTAL_NAV: Record<Role, NavigationGroup[]> = {
  STUDENT_EMPLOYEE: STUDENT_NAVIGATION,
  LOST_FOUND_OFFICER: OFFICER_NAVIGATION,
  TECHNICIAN: TECHNICIAN_NAVIGATION,
  MAINTENANCE_MANAGER: MANAGER_NAVIGATION,
  SUPER_ADMIN: ADMIN_NAVIGATION,
};

export function isMnuPortalRole(role?: Role | null): boolean {
  return Boolean(role && role in MNU_PORTAL_NAV);
}

export function getNavigation(role: Role): NavigationGroup[] {
  return MNU_PORTAL_NAV[role];
}
