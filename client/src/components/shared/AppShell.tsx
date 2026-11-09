import { ChevronDown, LogOut, Menu, UserRound, X } from 'lucide-react';
import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BrandMark } from '@/components/shared/BrandMark';
import { LanguageToggle } from '@/components/shared/LanguageToggle';
import { NotificationBell } from '@/components/shared/NotificationBell';
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
import { getInitials } from '@/lib/utils';
import { ROLE_SHORT_LABELS } from '@/types/auth';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/profile': 'Profile',
  '/forbidden': 'Access denied',
  '/users': 'Users',
  '/locations': 'Locations',
  '/activity-logs': 'Activity logs',
  '/technicians': 'Technicians',
  '/maintenance/requests': 'Maintenance requests',
  '/maintenance/requests/new': 'New request',
  '/maintenance/request-queue': 'Request queue',
  '/maintenance/calendar': 'Maintenance calendar',
  '/maintenance/feedback': 'Feedback',
  '/maintenance/preventive': 'Preventive plans',
  '/lost-found': 'Lost & Found',
  '/lost-found/report': 'Report an item',
  '/lost-found/my-reports': 'My reports',
  '/lost-found/items': 'All reports',
  '/lost-found/archived': 'Archived items',
  '/lost-found/matches': 'Match suggestions',
  '/lost-found/claims': 'Claims',
  '/lost-found/claims/new': 'Submit claim',
  '/lost-found/handovers': 'Handovers',
  '/work-orders': 'Work orders',
};

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (/^\/maintenance\/requests\/[^/]+$/.test(pathname)) return 'Request details';
  if (/^\/work-orders\/[^/]+$/.test(pathname)) return 'Work order details';
  if (/^\/lost-found\/items\/[^/]+$/.test(pathname)) return 'Lost & Found item';
  if (/^\/lost-found\/claims\/[^/]+$/.test(pathname)) return 'Claim details';
  return 'CampusCare';
}

function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-full border border-border bg-card py-1 ps-1 pe-2 text-start shadow-sm transition-colors hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="Open account menu"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <span className="hidden min-w-0 sm:block">
            <bdi className="block max-w-[140px] truncate text-xs font-semibold leading-tight text-foreground">
              {user.name}
            </bdi>
            <span className="block text-[10px] leading-tight text-muted-foreground">
              {ROLE_SHORT_LABELS[user.role]}
            </span>
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="normal-case tracking-normal">
          <bdi className="block truncate text-sm font-semibold text-foreground">{user.name}</bdi>
          <span dir="ltr" className="mt-0.5 block truncate text-xs font-normal text-muted-foreground">
            {user.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/profile" className="cursor-pointer">
            <UserRound className="h-4 w-4" aria-hidden="true" />
            Profile
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
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppShell() {
  const { user } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  const title = getPageTitle(location.pathname);

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Skip to content
      </a>

      <aside className="fixed inset-y-0 start-0 z-40 hidden w-72 lg:block">
        <SidebarContent />
      </aside>

      <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogContent
          showClose={false}
          className="fixed start-0 top-0 flex h-full w-[86%] max-w-xs translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 border-e border-sidebar-border bg-sidebar p-0 text-sidebar-foreground sm:rounded-none"
        >
          <DialogTitle className="sr-only">Navigation</DialogTitle>
          <DialogDescription className="sr-only">
            Primary CampusCare navigation for your role.
          </DialogDescription>
          <DialogClose
            className="absolute end-3 top-4 z-10 rounded-md p-1.5 text-sidebar-muted transition-colors hover:bg-sidebar-active hover:text-sidebar-foreground focus-visible:ring-sidebar-foreground"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </DialogClose>
          <SidebarContent onNavigate={() => setMobileOpen(false)} />
        </DialogContent>
      </Dialog>

      <div className="flex min-h-screen flex-col lg:ps-72">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border bg-background/95 px-4 backdrop-blur sm:px-6 lg:hidden">
          <div className="flex min-w-0 items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="h-4 w-4" aria-hidden="true" />
            </Button>
            <BrandMark className="min-w-0" />
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <NotificationBell poll={false} />
            <UserMenu />
          </div>
        </header>

        <header className="sticky top-0 z-30 hidden h-16 shrink-0 items-center justify-between border-b border-border bg-background/90 px-8 backdrop-blur lg:flex">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">CampusCare</span>
            <span className="text-border" aria-hidden="true">
              /
            </span>
            <span className="font-medium text-foreground">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <NotificationBell />
            <UserMenu />
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
