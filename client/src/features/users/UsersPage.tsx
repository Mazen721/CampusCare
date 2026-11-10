import { Pencil, Plus, Power, UserCheck, UserRound, Users } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable';
import { PageHeader } from '@/components/shared/PageHeader';
import { useAuth } from '@/features/auth/AuthContext';
import { UserFormDialog } from '@/features/users/UserFormDialog';
import { usersApi } from '@/features/users/usersApi';
import { tr } from '@/i18n/localize';
import { getErrorMessage } from '@/lib/api';
import { enumLabel } from '@/lib/labels';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { formatDate, getInitials } from '@/lib/utils';
import { ROLES, type Role } from '@/types/auth';
import type { UserRecord } from '@/types/users';

type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

const PAGE_SIZE = 10;

export function UsersPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [roleFilter, setRoleFilter] = useState<'ALL' | Role>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<UserRecord | null>(null);
  const [statusTarget, setStatusTarget] = useState<UserRecord | null>(null);

  const usersQuery = useQuery({
    queryKey: ['users', { page, search: debouncedSearch, roleFilter, statusFilter }],
    queryFn: () =>
      usersApi.list({
        page,
        limit: PAGE_SIZE,
        q: debouncedSearch || undefined,
        role: roleFilter === 'ALL' ? undefined : roleFilter,
        isActive:
          statusFilter === 'ALL' ? undefined : statusFilter === 'ACTIVE',
      }),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      usersApi.updateStatus(id, isActive),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(variables.isActive ? t('users.userActivatedSuccess') : t('users.userDeactivatedSuccess'));
      setStatusTarget(null);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const columns: Array<DataTableColumn<UserRecord>> = [
    {
      id: 'user',
      header: t('users.account'),
      cell: (user) => (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
              {getInitials(tr(user, 'name') || user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">
              <bdi>{tr(user, 'name') || user.name}</bdi>
            </p>
            <p className="truncate text-xs text-muted-foreground">
              <span dir="ltr">{user.email}</span>
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'role',
      header: t('users.role'),
      cell: (user) => (
        <Badge variant="outline" className="font-normal">
          {enumLabel('role', user.role)}
        </Badge>
      ),
    },
    {
      id: 'department',
      header: t('users.department'),
      cell: (user) => (
        <span className="line-clamp-2 text-sm text-muted-foreground">
          {tr(user, 'department') || '—'}
        </span>
      ),
    },
    {
      id: 'status',
      header: t('common.status'),
      cell: (user) => (
        <Badge
          variant="outline"
          className={
            user.isActive
              ? 'border-teal-300 bg-teal-50 text-teal-900'
              : 'border-stone-300 bg-stone-100 text-stone-600'
          }
        >
          <span
            className={
              user.isActive
                ? 'h-1.5 w-1.5 rounded-full bg-teal-600'
                : 'h-1.5 w-1.5 rounded-full bg-stone-400'
            }
            aria-hidden="true"
          />
          {user.isActive ? t('common.active') : t('common.inactive')}
        </Badge>
      ),
    },
    {
      id: 'created',
      header: t('common.createdAt'),
      cell: (user) => (
        <span className="whitespace-nowrap text-xs text-muted-foreground">
          {formatDate(user.createdAt)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: t('common.actions'),
      headerClassName: 'text-end',
      className: 'text-end',
      cell: (user) => {
        const isSelf = user.id === currentUser?.id;
        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label={`${t('common.edit')} ${user.name}`}
              onClick={() => {
                setEditing(user);
                setFormOpen(true);
              }}
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
            </Button>
            {isSelf ? (
              <span className="px-2 text-[11px] text-muted-foreground" title={t('users.cannotDeactivateSelf')}>
                {t('users.you')}
              </span>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className={
                  user.isActive
                    ? 'h-8 w-8 text-muted-foreground hover:text-destructive'
                    : 'h-8 w-8 text-muted-foreground hover:text-primary'
                }
                aria-label={`${user.isActive ? t('users.deactivateUser') : t('users.activateUser')} ${user.name}`}
                onClick={() => setStatusTarget(user)}
              >
                {user.isActive ? (
                  <Power className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <UserCheck className="h-4 w-4" aria-hidden="true" />
                )}
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const errorMessage = usersQuery.error ? getErrorMessage(usersQuery.error) : null;

  const isReactivating = statusTarget ? !statusTarget.isActive : false;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('nav.groupOverview')}
        title={t('users.title')}
        description={t('users.subtitle')}
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t('users.createUser')}
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={usersQuery.data?.data ?? []}
        rowKey={(user) => user.id}
        isLoading={usersQuery.isLoading}
        error={errorMessage}
        onRetry={() => void usersQuery.refetch()}
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder={t('users.searchPlaceholder')}
        filters={[
          {
            id: 'role',
            label: t('users.role'),
            value: roleFilter,
            options: [
              { label: t('users.allRoles'), value: 'ALL' },
              ...ROLES.map((role) => ({ label: enumLabel('role', role), value: role })),
            ],
            onChange: (value) => {
              setRoleFilter(value as 'ALL' | Role);
              setPage(1);
            },
          },
          {
            id: 'status',
            label: t('common.status'),
            value: statusFilter,
            options: [
              { label: t('users.allStatuses'), value: 'ALL' },
              { label: t('common.active'), value: 'ACTIVE' },
              { label: t('common.inactive'), value: 'INACTIVE' },
            ],
            onChange: (value) => {
              setStatusFilter(value as StatusFilter);
              setPage(1);
            },
          },
        ]}
        page={page}
        limit={PAGE_SIZE}
        total={usersQuery.data?.total ?? 0}
        onPageChange={setPage}
        emptyIcon={search ? UserRound : Users}
        emptyTitle={t('users.noUsersFound')}
        emptyDescription={t('users.noUsersFound')}
        emptyAction={
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t('users.createUser')}
          </Button>
        }
      />

      <UserFormDialog open={formOpen} onOpenChange={setFormOpen} user={editing} />

      <ConfirmDialog
        open={Boolean(statusTarget)}
        onOpenChange={(open) => {
          if (!open && !updateStatus.isPending) setStatusTarget(null);
        }}
        title={isReactivating ? t('users.activateAccount') : t('users.deactivateAccount')}
        description={
          statusTarget
            ? isReactivating
              ? t('users.confirmActivateDesc', { name: tr(statusTarget, 'name') || statusTarget.name })
              : t('users.confirmDeactivateDesc', { name: tr(statusTarget, 'name') || statusTarget.name })
            : ''
        }
        confirmLabel={isReactivating ? t('users.activateAccount') : t('users.deactivateAccount')}
        tone={isReactivating ? 'default' : 'destructive'}
        isLoading={updateStatus.isPending}
        onConfirm={() => {
          if (statusTarget) {
            updateStatus.mutate({
              id: statusTarget.id,
              isActive: !statusTarget.isActive,
            });
          }
        }}
      />
    </div>
  );
}
