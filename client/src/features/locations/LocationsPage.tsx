import { MapPin, Pencil, Plus, Power } from 'lucide-react';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LocationFormDialog } from '@/features/locations/LocationFormDialog';
import { locationsApi } from '@/features/locations/locationsApi';
import { ApiError } from '@/lib/api';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import type { LocationRecord } from '@/types/locations';

type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

const PAGE_SIZE = 10;

export function LocationsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<LocationRecord | null>(null);
  const [deactivating, setDeactivating] = useState<LocationRecord | null>(null);

  const locationsQuery = useQuery({
    queryKey: ['locations', { page, search: debouncedSearch, statusFilter }],
    queryFn: () =>
      locationsApi.list({
        page,
        limit: PAGE_SIZE,
        q: debouncedSearch || undefined,
        includeInactive: true,
        isActive:
          statusFilter === 'ALL' ? undefined : statusFilter === 'ACTIVE',
      }),
  });

  const deactivateLocation = useMutation({
    mutationFn: (id: string) => locationsApi.deactivate(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['locations'] });
      toast.success('Location deactivated. It will no longer appear in request forms.');
      setDeactivating(null);
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Unable to deactivate this location');
    },
  });

  const columns: Array<DataTableColumn<LocationRecord>> = [
    {
      id: 'location',
      header: 'Location',
      cell: (location) => (
        <div className="min-w-0">
          <p className="font-medium text-foreground">{location.buildingName}</p>
          <p className="truncate text-xs text-muted-foreground">
            {location.description || `${location.floor} · Room ${location.room}`}
          </p>
        </div>
      ),
    },
    {
      id: 'floor',
      header: 'Floor',
      cell: (location) => <span className="text-sm text-foreground">{location.floor}</span>,
    },
    {
      id: 'room',
      header: 'Room',
      cell: (location) => <span className="text-sm text-foreground">{location.room}</span>,
    },
    {
      id: 'type',
      header: 'Type',
      cell: (location) => (
        <Badge variant="outline" className="font-normal capitalize">
          {location.locationType.toLowerCase()}
        </Badge>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (location) => (
        <Badge
          variant="outline"
          className={
            location.isActive
              ? 'border-teal-300 bg-teal-50 text-teal-900'
              : 'border-stone-300 bg-stone-100 text-stone-600'
          }
        >
          <span
            className={
              location.isActive
                ? 'h-1.5 w-1.5 rounded-full bg-teal-600'
                : 'h-1.5 w-1.5 rounded-full bg-stone-400'
            }
            aria-hidden="true"
          />
          {location.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      headerClassName: 'text-end',
      className: 'text-end',
      cell: (location) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label={`Edit ${location.buildingName}, room ${location.room}`}
            onClick={() => {
              setEditing(location);
              setFormOpen(true);
            }}
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </Button>
          {location.isActive ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              aria-label={`Deactivate ${location.buildingName}, room ${location.room}`}
              onClick={() => setDeactivating(location)}
            >
              <Power className="h-4 w-4" aria-hidden="true" />
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  const errorMessage =
    locationsQuery.error instanceof ApiError
      ? locationsQuery.error.message
      : locationsQuery.error
        ? 'Unable to load locations right now.'
        : null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Campus locations"
        description="Reusable buildings, floors and rooms. Deactivating a location hides it from new reports while keeping its history intact."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add location
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={locationsQuery.data?.data ?? []}
        rowKey={(location) => location.id}
        isLoading={locationsQuery.isLoading}
        error={errorMessage}
        onRetry={() => void locationsQuery.refetch()}
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Search building, floor or room…"
        filters={[
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
        total={locationsQuery.data?.total ?? 0}
        onPageChange={setPage}
        emptyIcon={MapPin}
        emptyTitle={search ? 'No matching locations' : 'No locations yet'}
        emptyDescription={
          search
            ? 'Try a different building, floor or room name.'
            : 'Add the first campus location so users can report issues.'
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
            Add location
          </Button>
        }
      />

      <LocationFormDialog open={formOpen} onOpenChange={setFormOpen} location={editing} />

      <ConfirmDialog
        open={Boolean(deactivating)}
        onOpenChange={(open) => {
          if (!open && !deactivateLocation.isPending) setDeactivating(null);
        }}
        title="Deactivate this location?"
        description={
          deactivating
            ? `${deactivating.buildingName}, ${deactivating.floor}, Room ${deactivating.room} will be hidden from new requests and reports. Existing records are not changed.`
            : ''
        }
        confirmLabel="Deactivate location"
        tone="destructive"
        isLoading={deactivateLocation.isPending}
        onConfirm={() => {
          if (deactivating) deactivateLocation.mutate(deactivating.id);
        }}
      />
    </div>
  );
}
