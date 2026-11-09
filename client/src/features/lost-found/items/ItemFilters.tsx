import { RotateCcw, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { enumLabel } from '@/lib/labels';
import {
  ACTIVE_BROWSE_STATUSES,
  LOST_FOUND_CATEGORIES,
  REPORT_TYPES,
  type ItemStatus,
  type LostFoundCategory,
  type ReportType,
} from '@/types/lostFound';

export interface ItemFilterState {
  q: string;
  reportType: 'ALL' | ReportType;
  category: 'ALL' | LostFoundCategory;
  building: string;
  color: string;
  brand: string;
  status: 'ALL' | ItemStatus;
  from: string;
  to: string;
}

export const EMPTY_ITEM_FILTERS: ItemFilterState = {
  q: '',
  reportType: 'ALL',
  category: 'ALL',
  building: '',
  color: '',
  brand: '',
  status: 'ALL',
  from: '',
  to: '',
};

interface ItemFiltersProps {
  values: ItemFilterState;
  onChange: (patch: Partial<ItemFilterState>) => void;
  onReset: () => void;
  allowedStatuses?: readonly ItemStatus[];
}

const fieldClass =
  'h-9 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';
const labelClass =
  'mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground';

export function ItemFilters({
  values,
  onChange,
  onReset,
  allowedStatuses = ACTIVE_BROWSE_STATUSES,
}: ItemFiltersProps) {
  const { t } = useTranslation();

  return (
    <section className="rounded-lg border bg-card p-4 shadow-panel" aria-label={t('common.filters')}>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="md:col-span-2">
          <label htmlFor="item-search" className={labelClass}>
            {t('common.search')}
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              id="item-search"
              type="search"
              value={values.q}
              onChange={(event) => onChange({ q: event.target.value })}
              placeholder={t('lostFound.searchPlaceholder')}
              className={`${fieldClass} ps-9`}
            />
          </div>
        </div>

        <div>
          <label htmlFor="item-type" className={labelClass}>
            {t('lostFound.filterByType')}
          </label>
          <select
            id="item-type"
            value={values.reportType}
            onChange={(event) =>
              onChange({ reportType: event.target.value as ItemFilterState['reportType'] })
            }
            className={fieldClass}
          >
            <option value="ALL">{t('lostFound.allTypes')}</option>
            {REPORT_TYPES.map((type) => (
              <option key={type} value={type}>
                {enumLabel('reportType', type)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="item-category" className={labelClass}>
            {t('common.category')}
          </label>
          <select
            id="item-category"
            value={values.category}
            onChange={(event) =>
              onChange({ category: event.target.value as ItemFilterState['category'] })
            }
            className={fieldClass}
          >
            <option value="ALL">{t('lostFound.allCategories')}</option>
            {LOST_FOUND_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {enumLabel('lostFoundCategory', category)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="item-building" className={labelClass}>
            {t('locations.buildingName')}
          </label>
          <input
            id="item-building"
            type="text"
            value={values.building}
            onChange={(event) => onChange({ building: event.target.value })}
            placeholder={t('locations.buildingNamePlaceholder')}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="item-color" className={labelClass}>
            {t('lostFound.color')}
          </label>
          <input
            id="item-color"
            type="text"
            value={values.color}
            onChange={(event) => onChange({ color: event.target.value })}
            placeholder={t('lostFound.colorPlaceholder')}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="item-brand" className={labelClass}>
            {t('lostFound.brand')}
          </label>
          <input
            id="item-brand"
            type="text"
            value={values.brand}
            onChange={(event) => onChange({ brand: event.target.value })}
            placeholder={t('lostFound.brandPlaceholder')}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="item-status" className={labelClass}>
            {t('common.status')}
          </label>
          <select
            id="item-status"
            value={values.status}
            onChange={(event) =>
              onChange({ status: event.target.value as ItemFilterState['status'] })
            }
            className={fieldClass}
          >
            <option value="ALL">{t('lostFound.allStatuses')}</option>
            {allowedStatuses.map((status) => (
              <option key={status} value={status}>
                {enumLabel('status', status)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="item-from" className={labelClass}>
            {t('common.date')} ({t('common.previous')})
          </label>
          <input
            id="item-from"
            type="date"
            value={values.from}
            onChange={(event) => onChange({ from: event.target.value })}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="item-to" className={labelClass}>
            {t('common.date')} ({t('common.next')})
          </label>
          <input
            id="item-to"
            type="date"
            value={values.to}
            onChange={(event) => onChange({ to: event.target.value })}
            className={fieldClass}
          />
        </div>

        <div className="flex items-end md:col-span-2 xl:col-span-1">
          <Button type="button" variant="outline" className="w-full" onClick={onReset}>
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            {t('common.clearFilters')}
          </Button>
        </div>
      </div>
    </section>
  );
}
