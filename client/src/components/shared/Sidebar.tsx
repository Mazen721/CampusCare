import { LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import { BrandMark } from '@/components/shared/BrandMark';
import { getNavigation } from '@/components/shared/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/AuthContext';
import { enumLabel } from '@/lib/labels';
import { cn, getInitials } from '@/lib/utils';

interface SidebarContentProps {
  onNavigate?: () => void;
}

export function SidebarContent({ onNavigate }: SidebarContentProps) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  if (!user) return null;

  const groups = getNavigation(user.role);

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 shrink-0 items-center border-b border-sidebar-border px-5">
        <BrandMark inverted />
      </div>

      <div className="flex items-center gap-2 border-b border-sidebar-border px-5 py-4">
        <span className="inline-flex items-center rounded-full border border-sidebar-border bg-sidebar-active px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground">
          {enumLabel('role', user.role)}
        </span>
      </div>

      <nav
        className="flex-1 space-y-6 overflow-y-auto px-3 py-5"
        aria-label={t('nav.groupOverview')}
      >
        {groups.map((group) => (
          <div key={group.titleKey}>
            <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-muted/80">
              {t(group.titleKey)}
            </p>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;

                if (item.soon) {
                  return (
                    <li key={`${group.titleKey}-${item.labelKey}`}>
                      <div
                        aria-disabled="true"
                        title={t('common.soon')}
                        className="flex cursor-not-allowed items-center gap-3 rounded-md px-2.5 py-2 text-sm text-sidebar-muted/60"
                      >
                        <Icon className="h-4 w-4 shrink-0" strokeWidth={1.8} aria-hidden="true" />
                        <span className="truncate">{t(item.labelKey)}</span>
                        <span className="ms-auto rounded-full border border-sidebar-border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-sidebar-muted/80">
                          {t('common.soon')}
                        </span>
                      </div>
                    </li>
                  );
                }

                return (
                  <li key={`${group.titleKey}-${item.labelKey}`}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors',
                          isActive
                            ? 'bg-sidebar-active font-medium text-sidebar-foreground shadow-[inset_3px_0_0_#d9a441] rtl:shadow-[inset_-3px_0_0_#d9a441]'
                            : 'text-sidebar-muted hover:bg-sidebar-active/60 hover:text-sidebar-foreground',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon
                            className={cn(
                              'h-4 w-4 shrink-0',
                              isActive ? 'text-amber-400' : 'text-sidebar-muted',
                            )}
                            strokeWidth={1.8}
                            aria-hidden="true"
                          />
                          <span className="truncate">{t(item.labelKey)}</span>
                        </>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-lg bg-sidebar-active/50 p-2.5">
          <Avatar className="h-9 w-9 border border-sidebar-border">
            <AvatarFallback className="bg-sidebar-active text-xs text-sidebar-foreground">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-sidebar-foreground">
              <bdi>{user.name}</bdi>
            </p>
            <p className="truncate text-[11px] text-sidebar-muted">
              {enumLabel('role', user.role)}
              {user.department ? ` · ${user.department}` : ''}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-sidebar-muted hover:bg-sidebar-border/60 hover:text-sidebar-foreground"
            onClick={logout}
            aria-label={t('auth.signOut')}
            title={t('auth.signOut')}
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
