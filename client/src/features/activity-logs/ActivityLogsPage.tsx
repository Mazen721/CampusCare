import { ScrollText } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable';
import { PageHeader } from '@/components/shared/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { activityLogsApi } from '@/features/activity-logs/activityLogsApi';
import { usersApi } from '@/features/users/usersApi';
import { ApiError } from '@/lib/api';
import { enumLabel } from '@/lib/labels';
import { formatDate } from '@/lib/utils';
import type { ActivityLogRecord } from '@/types/activityLogs';
import { ACTIVITY_ENTITY_TYPES } from '@/types/activityLogs';

const PAGE_SIZE = 15;

function startOfDay(value: string): string | undefined {
  return value ? new Date(`${value}T00:00:00`).toISOString() : undefined;
}

function endOfDay(value: string): string | undefined {
  return value ? new Date(`${value}T23:59:59.999`).toISOString() : undefined;
}

export function ActivityLogsPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [entityType, setEntityType] = useState('ALL');
  const [actorId, setActorId] = useState('ALL');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const logsQuery = useQuery({
    queryKey: ['activity-logs', { entityType, actorId, from, to, page }],
    queryFn: () =>
      activityLogsApi.list({
        entityType: entityType === 'ALL' ? undefined : entityType,
        actorId: actorId === 'ALL' ? undefined : actorId,
        from: startOfDay(from),
        to: endOfDay(to),
        page,
        limit: PAGE_SIZE,
      }),
  });

  const actorsQuery = useQuery({
    queryKey: ['users', { activityLogActors: true }],
    queryFn: () => usersApi.list({ limit: 100 }),
  });

  const logs = logsQuery.data?.data ?? [];
  const total = logsQuery.data?.total ?? 0;
  const actors = actorsQuery.data?.data ?? [];
  const hasDateFilter = Boolean(from || to);

  const columns: Array<DataTableColumn<ActivityLogRecord>> = [
    {
      id: 'createdAt',
      header: t('activityLogs.timestamp'),
      className: 'whitespace-nowrap align-top',
      cell: (entry) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(entry.createdAt, { dateStyle: 'medium', timeStyle: 'short' })}
        </span>
      ),
    },
    {
      id: 'actor',
      header: t('activityLogs.actor'),
      cell: (entry) =>
        entry.actor ? (
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground"><bdi>{entry.actor.name}</bdi></p>
            <p className="truncate text-xs text-muted-foreground">
              {entry.actor.role ? enumLabel('role', entry.actor.role) : t('common.none')}
              {entry.actor.email ? (
                <>
                  {' · '}
                  <span dir="ltr">{entry.actor.email}</span>
                </>
              ) : (
                ''
              )}
            </p>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">{t('activityLogs.deletedUser')}</span>
        ),
    },
    {
      id: 'action',
      header: t('activityLogs.action'),
      cell: (entry) => (
        <span className="font-mono text-xs font-medium text-foreground">
          {enumLabel('action', entry.action)}
        </span>
      ),
    },
    {
      id: 'entity',
      header: t('activityLogs.entityType'),
      cell: (entry) => (
        <Badge variant="outline" className="whitespace-nowrap text-xs">
          {enumLabel('entityType', entry.entityType)}
        </Badge>
      ),
    },
    {
      id: 'description',
      header: t('activityLogs.description'),
      cell: (entry) => (
        <p className="max-w-[320px] text-xs leading-relaxed text-muted-foreground">
          {entry.description}
        </p>
      ),
    },
  ];

  const errorMessage =
    logsQuery.error instanceof ApiError
      ? logsQuery.error.message
      : logsQuery.error
        ? t('errors.generic')
        : null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('nav.activityLogs')}
        title={t('activityLogs.title')}
        description={t('activityLogs.subtitle')}
      />

      <DataTable
        columns={columns}
        data={logs}
        rowKey={(entry) => entry.id}
        isLoading={logsQuery.isLoading}
        error={errorMessage}
        onRetry={() => void logsQuery.refetch()}
        filters={[
          {
            id: 'entity',
            label: t('activityLogs.entityType'),
            value: entityType,
            options: [
              { label: t('activityLogs.allEntities'), value: 'ALL' },
              ...ACTIVITY_ENTITY_TYPES.map((type) => ({
                label: enumLabel('entityType', type),
                value: type,
              })),
            ],
            onChange: (value) => {
              setEntityType(value);
              setPage(1);
            },
          },
          {
            id: 'actor',
            label: t('activityLogs.actor'),
            value: actorId,
            options: [
              { label: t('common.all'), value: 'ALL' },
              ...actors.map((actor) => ({
                label: `${actor.name} (${enumLabel('role', actor.role)})`,
                value: actor.id,
              })),
            ],
            onChange: (value) => {
              setActorId(value);
              setPage(1);
            },
          },
        ]}
        toolbar={
          <>
            <label htmlFor="activity-from" className="text-xs font-medium text-muted-foreground">
              {t('common.date')}
            </label>
            <Input
              id="activity-from"
              type="date"
              value={from}
              max={to || undefined}
              onChange={(event) => {
                setFrom(event.target.value);
                setPage(1);
              }}
              className="h-9 w-[150px]"
            />
            <Input
              id="activity-to"
              type="date"
              value={to}
              min={from || undefined}
              onChange={(event) => {
                setTo(event.target.value);
                setPage(1);
              }}
              className="h-9 w-[150px]"
            />
            {hasDateFilter ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFrom('');
                  setTo('');
                  setPage(1);
                }}
              >
                {t('common.clearFilters')}
              </Button>
            ) : null}
          </>
        }
        page={page}
        limit={PAGE_SIZE}
        total={total}
        onPageChange={setPage}
        emptyTitle={t('activityLogs.noLogsFound')}
        emptyDescription={t('activityLogs.noLogsFound')}
        emptyIcon={ScrollText}
      />
    </div>
  );
}
