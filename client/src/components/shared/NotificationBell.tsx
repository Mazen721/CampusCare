import { Bell, BellRing, CheckCheck, ClipboardList, Loader2, PackageSearch, Wrench } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { notificationsApi } from '@/features/notifications/notificationsApi';
import { fmtDistanceToNow } from '@/lib/dateLocale';
import { cn } from '@/lib/utils';
import { resolveParams } from '@/i18n/localize';
import type { AppNotification } from '@/types/notifications';

const NOTIFICATIONS_QUERY_KEY = ['notifications', 'bell'] as const;

function iconForType(type?: string): LucideIcon {
  if (!type) {
    return Bell;
  }
  if (type.includes('CLAIM') || type.includes('ITEM') || type.includes('MATCH')) {
    return PackageSearch;
  }
  if (type.includes('WORK_ORDER') || type.includes('ASSIGNED')) {
    return Wrench;
  }
  if (type.includes('REQUEST')) {
    return ClipboardList;
  }
  return Bell;
}

interface NotificationRowProps {
  notification: AppNotification;
  onOpen: (notification: AppNotification) => void;
}

function NotificationRow({ notification, onOpen }: NotificationRowProps) {
  const { t } = useTranslation();
  const Icon = iconForType(notification.type);
  const destination = notification.linkUrl ?? '/dashboard';
  const resolvedParams = resolveParams(notification.params);
  const localizedTitle = notification.titleKey
    ? t(`notif.${notification.titleKey}`, { ...resolvedParams, defaultValue: notification.title })
    : notification.title;
  const localizedMessage = notification.messageKey
    ? t(`notif.${notification.messageKey}`, { ...resolvedParams, defaultValue: notification.message })
    : notification.message;

  return (
    <DropdownMenuItem asChild>
      <Link
        to={destination}
        onClick={() => onOpen(notification)}
        className="flex cursor-pointer items-start gap-3 px-3 py-3"
      >
        <span
          className={cn(
            'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
            notification.isRead
              ? 'bg-muted text-muted-foreground'
              : 'bg-primary/10 text-primary',
          )}
        >
          <Icon className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-start gap-2">
            <span
              className={cn(
                'line-clamp-2 text-sm leading-snug',
                notification.isRead ? 'text-muted-foreground' : 'font-semibold text-foreground',
              )}
            >
              {localizedTitle}
            </span>
            {!notification.isRead ? (
              <span
                className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                aria-label={t('notifications.unread')}
              />
            ) : null}
          </span>
          <span className="mt-1 line-clamp-2 block text-xs leading-relaxed text-muted-foreground">
            {localizedMessage}
          </span>
          <span className="mt-1 block text-[11px] text-muted-foreground/80">
            {fmtDistanceToNow(notification.createdAt, { addSuffix: true })}
          </span>
        </span>
      </Link>
    </DropdownMenuItem>
  );
}

export function NotificationBell({ poll = true }: { poll?: boolean }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: () => notificationsApi.list({ limit: 10 }),
    refetchInterval: poll ? 30_000 : false,
    staleTime: 15_000,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY }),
  });

  const markAllRead = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: ({ updated }) => {
      toast.success(updated > 0 ? t('common.success') : t('notifications.allCaughtUp'));
      return queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
    onError: () => toast.error(t('errors.generic')),
  });

  const notifications = notificationsQuery.data?.data ?? [];
  const unreadCount = notificationsQuery.data?.unreadCount ?? 0;

  const handleOpen = (notification: AppNotification) => {
    if (!notification.isRead) {
      markRead.mutate(notification.id);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={t('notifications.title')}
        >
          {unreadCount > 0 ? (
            <BellRing className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Bell className="h-5 w-5" aria-hidden="true" />
          )}
          {unreadCount > 0 ? (
            <span className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground ring-2 ring-card">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(22rem,calc(100vw-2rem))] p-0">
        <div className="flex items-center justify-between gap-3 border-b px-3 py-2.5">
          <DropdownMenuLabel className="p-0 normal-case tracking-normal">
            {t('notifications.title')}
            {unreadCount > 0 ? (
              <span className="ms-2 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                {unreadCount} {t('notifications.unread')}
              </span>
            ) : null}
          </DropdownMenuLabel>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-[11px]"
            onClick={() => markAllRead.mutate()}
            disabled={unreadCount === 0 || markAllRead.isPending}
          >
            {markAllRead.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {t('notifications.markAllAsRead')}
          </Button>
        </div>

        <div className="max-h-[22rem] overflow-y-auto">
          {notificationsQuery.isLoading ? (
            <div className="space-y-2 p-3" aria-busy="true" aria-label={t('common.loading')}>
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : notificationsQuery.isError ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm font-medium text-foreground">{t('notifications.unableToLoad')}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => void notificationsQuery.refetch()}
              >
                {t('ai.retry')}
              </Button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Bell className="h-5 w-5" aria-hidden="true" />
              </span>
              <p className="text-sm font-medium text-foreground">{t('notifications.allCaughtUp')}</p>
              <p className="text-xs text-muted-foreground">
                {t('notifications.noNotifications')}
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <NotificationRow
                key={notification.id}
                notification={notification}
                onOpen={handleOpen}
              />
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
