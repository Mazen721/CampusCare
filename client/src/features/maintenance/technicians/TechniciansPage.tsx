import { Eye, Filter, Pencil, Plus, Star, Users } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable';
import { PageHeader } from '@/components/shared/PageHeader';
import { TechnicianDetailDialog } from '@/features/maintenance/technicians/TechnicianDetailDialog';
import { TechnicianFormDialog } from '@/features/maintenance/technicians/TechnicianFormDialog';
import { techniciansApi } from '@/features/maintenance/technicians/techniciansApi';
import { tr } from '@/i18n/localize';
import { enumLabel } from '@/lib/labels';
import { getInitials } from '@/lib/utils';
import { MAINTENANCE_CATEGORIES, type MaintenanceCategory } from '@/types/meta';
import type { TechnicianRecord } from '@/types/technicians';

const PAGE_SIZE = 10;

export function TechniciansPage() {
  const { t } = useTranslation();
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | MaintenanceCategory>('ALL');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTechnician, setEditingTechnician] = useState<TechnicianRecord | null>(null);
  const [detailTechnicianId, setDetailTechnicianId] = useState<string | null>(null);

  const techniciansQuery = useQuery({
    queryKey: ['technicians', { categoryFilter, page }],
    queryFn: () =>
      techniciansApi.list({
        category: categoryFilter === 'ALL' ? undefined : categoryFilter,
        page,
        limit: PAGE_SIZE,
      }),
  });

  const technicians = techniciansQuery.data?.data ?? [];
  const total = techniciansQuery.data?.total ?? 0;

  const columns: Array<DataTableColumn<TechnicianRecord>> = [
    {
      id: 'technician',
      header: t('workOrders.technician'),
      cell: (tech: TechnicianRecord) => (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
              {getInitials(tr(tech, 'name') || tech.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="truncate font-medium text-foreground">
                <bdi>{tr(tech, 'name') || tech.name}</bdi>
              </span>
              {tech.matchesCategory && (
                <Badge variant="default" className="text-[10px] py-0 px-1.5 bg-amber-500 hover:bg-amber-600">
                  {t('technicians.matchBadge')}
                </Badge>
              )}
            </div>
            <p className="truncate text-xs text-muted-foreground">
              <span dir="ltr">{tech.email}</span>
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'availability',
      header: t('technicians.availability'),
      cell: (tech: TechnicianRecord) => {
        const isAvail = tech.availability === 'AVAILABLE';
        const isBusy = tech.availability === 'BUSY';
        return (
          <Badge
            variant="outline"
            className={
              isAvail
                ? 'border-emerald-500/40 bg-emerald-50 text-emerald-700'
                : isBusy
                ? 'border-amber-500/40 bg-amber-50 text-amber-700'
                : 'border-slate-500/40 bg-slate-50 text-slate-700'
            }
          >
            {enumLabel('availability', tech.availability)}
          </Badge>
        );
      },
    },
    {
      id: 'specializations',
      header: t('technicians.specializations'),
      cell: (tech: TechnicianRecord) => (
        <div className="flex max-w-[200px] flex-wrap gap-1">
          {tech.specializations && tech.specializations.length > 0 ? (
            tech.specializations.slice(0, 2).map((cat: string) => (
              <Badge key={cat} variant="secondary" className="text-[10px] font-normal">
                {enumLabel('maintenanceCategory', cat)}
              </Badge>
            ))
          ) : (
            <span className="text-xs text-muted-foreground">{t('technicians.generalMaintenance')}</span>
          )}
          {tech.specializations && tech.specializations.length > 2 && (
            <span className="text-[10px] text-muted-foreground self-center">
              +{tech.specializations.length - 2}
            </span>
          )}
        </div>
      ),
    },
    {
      id: 'workload',
      header: t('technicians.activeWorkOrders'),
      cell: (tech: TechnicianRecord) => (
        <div className="text-xs">
          <span className="font-semibold text-foreground">
            {t('technicians.activeTasksCount', { count: tech.activeWorkOrderCount })}
          </span>
          <span className="text-muted-foreground ms-1.5">
            {t('technicians.doneTasksCount', { count: tech.completedWorkOrderCount })}
          </span>
        </div>
      ),
    },
    {
      id: 'performance',
      header: t('dashboard.feedbackRating'),
      cell: (tech: TechnicianRecord) => (
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 font-medium">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            {tech.averageRating !== null ? tech.averageRating.toFixed(1) : '—'}
          </span>
          <span className="text-muted-foreground">
            {tech.averageResolutionHours !== null ? t('technicians.avgResolution', { hours: tech.averageResolutionHours }) : '—'}
          </span>
        </div>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: (tech: TechnicianRecord) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs"
            onClick={() => setDetailTechnicianId(tech.id)}
            title={t('common.view')}
          >
            <Eye className="h-3.5 w-3.5 me-1" />
            {t('common.view')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs"
            onClick={() => {
              setEditingTechnician(tech);
              setFormOpen(true);
            }}
            title={t('common.edit')}
          >
            <Pencil className="h-3.5 w-3.5 me-1" />
            {t('common.edit')}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('technicians.title')}
        description={t('technicians.monitorStaff')}
        actions={
          <Button
            onClick={() => {
              setEditingTechnician(null);
              setFormOpen(true);
            }}
          >
            <Plus className="me-2 h-4 w-4" />
            {t('technicians.createTechnician')}
          </Button>
        }
      />

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-3">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Filter className="h-3.5 w-3.5" />
          <span>{t('technicians.matchCategory')}</span>
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value as 'ALL' | MaintenanceCategory);
            setPage(1);
          }}
          className="h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="ALL">{t('technicians.allCategories')}</option>
          {MAINTENANCE_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {enumLabel('maintenanceCategory', cat)}
            </option>
          ))}
        </select>
        {categoryFilter !== 'ALL' && (
          <span className="text-xs text-muted-foreground italic">
            {t('technicians.filterSpecializedHint', { category: enumLabel('maintenanceCategory', categoryFilter) })}
          </span>
        )}
      </div>

      <DataTable
        columns={columns}
        data={technicians}
        rowKey={(tech: TechnicianRecord) => tech.id}
        isLoading={techniciansQuery.isLoading}
        page={page}
        limit={PAGE_SIZE}
        total={total}
        onPageChange={setPage}
        emptyIcon={Users}
        emptyTitle={t('technicians.noTechniciansFound')}
        emptyDescription={t('technicians.noTechniciansFound')}
      />

      <TechnicianFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingTechnician(null);
        }}
        technician={editingTechnician}
      />

      <TechnicianDetailDialog
        technicianId={detailTechnicianId}
        open={Boolean(detailTechnicianId)}
        onOpenChange={(open) => {
          if (!open) setDetailTechnicianId(null);
        }}
        onEdit={() => {
          const target = technicians.find((t: TechnicianRecord) => t.id === detailTechnicianId);
          if (target) {
            setEditingTechnician(target);
            setFormOpen(true);
          }
        }}
      />
    </div>
  );
}
