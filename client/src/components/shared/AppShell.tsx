import {
  CalendarDays,
  ChevronDown,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  UserRound,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BrandMark } from '@/components/shared/BrandMark';
import { LanguageToggle } from '@/components/shared/LanguageToggle';
import { NotificationBell } from '@/components/shared/NotificationBell';
import {
  getNavigation,
  isMnuPortalRole,
  type NavigationItem,
} from '@/components/shared/navigation';
import { SidebarContent } from '@/components/shared/Sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/features/auth/AuthContext';
import { tr } from '@/i18n/localize';
import { enumLabel } from '@/lib/labels';
import { cn, formatDate, getInitials } from '@/lib/utils';

const ROUTE_KEYS: Record<string, string> = {
  '/dashboard': 'nav.dashboard',
  '/profile': 'nav.profile',
  '/forbidden': 'errors.forbiddenTitle',
  '/users': 'nav.users',
  '/locations': 'nav.locations',
  '/activity-logs': 'nav.activityLogs',
  '/technicians': 'nav.technicians',
  '/maintenance/requests': 'nav.requests',
  '/maintenance/requests/new': 'nav.reportIssue',
  '/maintenance/request-queue': 'nav.requestQueue',
  '/maintenance/calendar': 'nav.calendar',
  '/maintenance/feedback': 'nav.feedback',
  '/maintenance/preventive': 'nav.preventive',
  '/lost-found': 'nav.lostFound',
  '/lost-found/report': 'nav.reportLostFound',
  '/lost-found/my-reports': 'nav.myReports',
  '/lost-found/items': 'nav.allReports',
  '/lost-found/archived': 'nav.archivedItems',
  '/lost-found/matches': 'nav.matches',
  '/lost-found/claims': 'nav.claims',
  '/lost-found/claims/new': 'claims.submitClaim',
  '/lost-found/handovers': 'nav.handovers',
  '/work-orders': 'nav.workOrders',
};

function getPageTitle(pathname: string, t: (key: string) => string): string {
  const key = ROUTE_KEYS[pathname];
  if (key) return t(key);
  if (/^\/maintenance\/requests\/[^/]+$/.test(pathname)) return t('common.details');
  if (/^\/work-orders\/[^/]+$/.test(pathname)) return t('common.details');
  if (/^\/lost-found\/items\/[^/]+$/.test(pathname)) return t('lostFound.itemDetails');
  if (/^\/lost-found\/claims\/[^/]+$/.test(pathname)) return t('claims.title');
  return 'CampusCare';
}

function UserMenu({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const displayName = tr(user, 'name') || user.name;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1 rounded-full border border-border bg-card py-1 ps-1 pe-1.5 text-start shadow-sm transition-colors hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:gap-2 sm:pe-2"
          aria-label={t('auth.profileTitle')}
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">{getInitials(displayName)}</AvatarFallback>
          </Avatar>
          <span className={cn('hidden min-w-0', compact ? '2xl:block' : 'sm:block')}>
            <bdi className="block max-w-[140px] truncate text-xs font-semibold leading-tight text-foreground">
              {displayName}
            </bdi>
            <span className="block text-[11.5px] leading-tight text-muted-foreground">
              {enumLabel('role', user.role)}
            </span>
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="normal-case tracking-normal">
          <bdi className="block truncate text-sm font-semibold text-foreground">{displayName}</bdi>
          <span dir="ltr" className="mt-0.5 block truncate text-xs font-normal text-muted-foreground">
            {user.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/profile" className="cursor-pointer">
            <UserRound className="h-4 w-4" aria-hidden="true" />
            {t('nav.profile')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-destructive focus:text-destructive"
          onSelect={() => {
            logout();
            navigate('/login', { replace: true });
          }}
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          {t('auth.signOut')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const SIDEBAR_COLLAPSED_STORAGE_KEY = 'cc-sidebar-collapsed';

function readSidebarCollapsedPreference(): boolean {
  try {
    return window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Horizontal pill navigation displayed in the top bar when the desktop sidebar is collapsed.
 */
function DesktopFastNav({ items }: { items: NavigationItem[] }) {
  const { t } = useTranslation();

  return (
    <nav
      aria-label={t('nav.groupOverview')}
      className="flex min-w-0 flex-wrap items-center gap-1"
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={cn(
                    'h-3.5 w-3.5 shrink-0',
                    isActive ? 'text-[hsl(var(--mnu-gold))]' : 'text-muted-foreground',
                  )}
                  aria-hidden="true"
                />
                <span>{t(item.labelKey)}</span>
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}

export function AppShell() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(readSidebarCollapsedPreference);

  const isMnuPortal = isMnuPortalRole(user?.role);

  useEffect(() => {
    try {
      window.localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(sidebarCollapsed));
    } catch {
      // Ignore storage errors in restricted environments
    }
  }, [sidebarCollapsed]);

  useEffect(() => {
    document.body.classList.toggle('mnu-portal-surface', isMnuPortal);
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      themeMeta.setAttribute('content', isMnuPortal ? '#04153E' : '#12372c');
    }
    return () => {
      document.body.classList.remove('mnu-portal-surface');
      themeMeta?.setAttribute('content', '#04153E');
    };
  }, [isMnuPortal]);

  if (!user) return null;

  const title = getPageTitle(location.pathname, t);
  const headerDate = isMnuPortal
    ? formatDate(new Date(), { day: 'numeric', month: 'short', year: 'numeric' })
    : null;
  const fastNavItems = getNavigation(user.role).flatMap((group) =>
    group.items.filter((item) => !item.soon),
  );

  return (
    <div className={cn('min-h-screen bg-background', isMnuPortal && 'mnu-portal-surface')}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        CampusCare
      </a>

      {!sidebarCollapsed ? (
        <aside className="fixed inset-y-0 start-0 z-40 hidden w-72 lg:block">
          <SidebarContent onCollapse={() => setSidebarCollapsed(true)} />
        </aside>
      ) : null}

      <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogContent
          showClose={false}
          className={cn(
            'fixed inset-y-0 start-0 left-auto top-0 flex h-full w-[86%] max-w-xs translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 border-e border-sidebar-border bg-sidebar p-0 text-sidebar-foreground sm:rounded-none',
            isMnuPortal && 'mnu-portal-surface',
          )}
        >
          <DialogTitle className="sr-only">{t('nav.groupOverview')}</DialogTitle>
          <DialogDescription className="sr-only">
            CampusCare
          </DialogDescription>
          <DialogClose
            className={cn(
              'absolute end-3 top-4 z-10 rounded-md p-1.5 text-sidebar-muted transition-colors hover:bg-sidebar-active hover:text-sidebar-foreground',
              isMnuPortal
                ? 'focus-visible:ring-2 focus-visible:ring-[hsl(var(--mnu-gold))] focus-visible:ring-offset-0'
                : 'focus-visible:ring-sidebar-foreground',
            )}
            aria-label={t('common.close')}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </DialogClose>
          <SidebarContent onNavigate={() => setMobileOpen(false)} />
        </DialogContent>
      </Dialog>

      <div
        className={cn(
          'flex min-h-screen flex-col transition-[padding] duration-200',
          sidebarCollapsed ? 'lg:ps-0' : 'lg:ps-72',
        )}
      >
        <header
          className={cn(
            'sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border px-3 backdrop-blur sm:gap-3 sm:px-6 lg:hidden',
            isMnuPortal ? 'bg-card/95' : 'bg-background/95',
          )}
        >
          <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
            <Button
              variant="outline"
              size="icon"
              className="shrink-0"
              onClick={() => setMobileOpen(true)}
              aria-label={t('common.actions')}
            >
              <Menu className="h-4 w-4" aria-hidden="true" />
            </Button>
            <BrandMark portal={isMnuPortal} compactOnMobile className="min-w-0" />
          </div>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <LanguageToggle
              compactOnMobile
              className="gap-1 px-1.5 text-xs sm:gap-1.5 sm:px-2.5 sm:text-sm"
            />
            <NotificationBell poll={false} />
            <UserMenu />
          </div>
        </header>

        <header
          className={cn(
            'sticky top-0 z-30 hidden min-h-16 shrink-0 items-center justify-between gap-4 border-b border-border px-6 py-2 backdrop-blur lg:flex 2xl:px-8',
            isMnuPortal ? 'bg-card/95' : 'bg-background/90',
          )}
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              aria-label={sidebarCollapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar')}
              aria-expanded={!sidebarCollapsed}
              className="h-9 shrink-0 gap-1.5 rounded-lg border-border bg-card px-2.5 text-xs font-semibold text-foreground shadow-xs hover:bg-secondary/60"
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen className="h-4 w-4 text-primary rtl:rotate-180" aria-hidden="true" />
              ) : (
                <PanelLeftClose className="h-4 w-4 text-primary rtl:rotate-180" aria-hidden="true" />
              )}
              <span className={cn('hidden', sidebarCollapsed ? '2xl:inline' : 'xl:inline')}>
                {t('nav.menu')}
              </span>
            </Button>

            {sidebarCollapsed ? (
              <DesktopFastNav items={fastNavItems} />
            ) : (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">CampusCare</span>
                <span className="text-border" aria-hidden="true">
                  /
                </span>
                <span className={cn('text-foreground', isMnuPortal ? 'font-semibold' : 'font-medium')}>
                  {title}
                </span>
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {headerDate ? (
              <span
                className={cn(
                  'hidden items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-3 py-1.5 text-xs font-medium text-muted-foreground',
                  sidebarCollapsed ? '2xl:inline-flex' : 'xl:inline-flex',
                )}
              >
                <CalendarDays
                  className="h-3.5 w-3.5 text-[hsl(var(--mnu-gold-ink))]"
                  aria-hidden="true"
                />
                {headerDate}
              </span>
            ) : null}
            <LanguageToggle />
            <NotificationBell />
            <UserMenu compact={sidebarCollapsed} />
          </div>
        </header>

        <main
          id="main-content"
          className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
