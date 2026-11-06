import { Pencil, Plus, Power, UserCheck, UserRound, Users } from 'lucide-react';
import { useState } from 'react';
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
import { ApiError } from '@/lib/api';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { formatDate, getInitials } from '@/lib/utils';
import { ROLES, ROLE_LABELS, type Role } from '@/types/auth';
import type { UserRecord } from '@/types/users';

type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

const PAGE_SIZE = 10;

export function UsersPage() {
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
      toast.success(variables.isActive ? 'Account activated' : 'Account deactivated');
      setStatusTarget(null);
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Unable to update this account');
    },
  });

  const columns: Array<DataTableColumn<UserRecord>> = [
    {
      id: 'user',
      header: 'Account',
      cell: (user) => (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'role',
      header: 'Role',
      cell: (user) => (
        <Badge variant="outline" className="font-normal">
          {ROLE_LABELS[user.role]}
        </Badge>
      ),
    },
    {
      id: 'department',
      header: 'Department',
      cell: (user) => (
        <span className="line-clamp-2 text-sm text-muted-foreground">
          {user.department || '—'}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
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
          {user.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      id: 'created',
      header: 'Created',
      cell: (user) => (
        <span className="whitespace-nowrap text-xs text-muted-foreground">
          {formatDate(user.createdAt)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      headerClassName: 'text-right',
      className: 'text-right',
      cell: (user) => {
        const isSelf = user.id === currentUser?.id;
        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label={`Edit ${user.name}`}
              onClick={() => {
                setEditing(user);
                setFormOpen(true);
              }}
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
            </Button>
            {isSelf ? (
              <span className="px-2 text-[11px] text-muted-foreground" title="You cannot deactivate your own account">
                You
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
                aria-label={`${user.isActive ? 'Deactivate' : 'Activate'} ${user.name}`}
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

  const errorMessage =
    usersQuery.error instanceof ApiError
      ? usersQuery.error.message
      : usersQuery.error
        ? 'Unable to load user accounts right now.'
        : null;

  const isReactivating = statusTarget ? !statusTarget.isActive : false;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="User accounts"
        description="Create accounts for every role, keep profiles current and deactivate access without deleting history."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Create account
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
        searchPlaceholder="Search name, email or department…"
        filters={[
          {
            id: 'role',
            label: 'Role',
            value: roleFilter,
            options: [
              { label: 'All roles', value: 'ALL' },
              ...ROLES.map((role) => ({ label: ROLE_LABELS[role], value: role })),
            ],
            onChange: (value) => {
              setRoleFilter(value as 'ALL' | Role);
              setPage(1);
            },
          },
          {
            id: 'status',
            label: 'Status',
            value: statusFilter,
            options: [
              { label: 'All statuses', value: 'ALL' },
              { label: 'Active', value: 'ACTIVE' },
              { label: 'Inactive', value: 'INACTIVE' },
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
        emptyTitle={search ? 'No matching accounts' : 'No user accounts yet'}
        emptyDescription={
          search
            ? 'Try a different name, email address or department.'
            : 'Create the first account to give someone access to CampusCare.'
        }
        emptyAction={
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Create account
          </Button>
        }
      />

      <UserFormDialog open={formOpen} onOpenChange={setFormOpen} user={editing} />

      <ConfirmDialog
        open={Boolean(statusTarget)}
        onOpenChange={(open) => {
          if (!open && !updateStatus.isPending) setStatusTarget(null);
        }}
        title={isReactivating ? 'Activate this account?' : 'Deactivate this account?'}
        description={
          statusTarget
            ? isReactivating
              ? `${statusTarget.name} will be able to sign in again immediately.`
              : `${statusTarget.name} will be signed out and refused access. Their history is kept.`
            : ''
        }
        confirmLabel={isReactivating ? 'Activate account' : 'Deactivate account'}
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
