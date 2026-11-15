import { ChevronDown, RotateCcw, Search, SlidersHorizontal, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { enumLabel } from '@/lib/labels';
import { cn, formatNumber } from '@/lib/utils';
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

interface ActiveFilterChip {
  key: string;
  text: string;
  onClear: () => void;
}

const primaryControlClass =
  'h-10 rounded-md border border-input bg-card text-sm text-foreground shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';
const secondaryControlClass =
  'h-9 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';
const secondaryLabelClass = 'mb-1.5 block text-xs font-medium text-muted-foreground';

type TextFilterKey = 'building' | 'color' | 'brand' | 'from' | 'to';

function buildAdvancedChips(
  values: ItemFilterState,
  onChange: (patch: Partial<ItemFilterState>) => void,
  t: (key: string) => string,
): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];

  if (values.status !== 'ALL') {
    chips.push({
      key: 'status',
      text: `${t('common.status')}: ${enumLabel('status', values.status)}`,
      onClear: () => onChange({ status: 'ALL' }),
    });
  }

  const textEntries: Array<{ key: TextFilterKey; labelKey: string; trim?: boolean }> = [
    { key: 'building', labelKey: 'locations.building', trim: true },
    { key: 'color', labelKey: 'lostFound.color', trim: true },
    { key: 'brand', labelKey: 'lostFound.brand', trim: true },
    { key: 'from', labelKey: 'lostFound.dateFrom' },
    { key: 'to', labelKey: 'lostFound.dateTo' },
  ];

  for (const entry of textEntries) {
    const raw = values[entry.key];
    const display = entry.trim ? raw.trim() : raw;
    if (display) {
      chips.push({
        key: entry.key,
        text: `${t(entry.labelKey)}: ${display}`,
        onClear: () => onChange({ [entry.key]: '' }),
      });
    }
  }

  return chips;
}

export function ItemFilters({
  values,
  onChange,
  onReset,
  allowedStatuses = ACTIVE_BROWSE_STATUSES,
}: ItemFiltersProps) {
  const { t } = useTranslation();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const advancedChips = buildAdvancedChips(values, onChange, t);
  const advancedCount = advancedChips.length;
  const hasAnyFilter =
    values.q !== '' ||
    values.reportType !== 'ALL' ||
    values.category !== 'ALL' ||
    advancedCount > 0;

  const secondaryFields: Array<{
    id: string;
    key: TextFilterKey;
    label: string;
    type: 'text' | 'date';
    placeholder?: string;
  }> = [
    {
      id: 'item-building',
      key: 'building',
      label: t('locations.buildingName'),
      type: 'text',
      placeholder: t('locations.buildingNamePlaceholder'),
    },
    {
      id: 'item-color',
      key: 'color',
      label: t('lostFound.color'),
      type: 'text',
      placeholder: t('lostFound.colorPlaceholder'),
    },
    {
      id: 'item-brand',
      key: 'brand',
      label: t('lostFound.brand'),
      type: 'text',
      placeholder: t('lostFound.brandPlaceholder'),
    },
    {
      id: 'item-from',
      key: 'from',
      label: t('lostFound.dateFrom'),
      type: 'date',
    },
    {
      id: 'item-to',
      key: 'to',
      label: t('lostFound.dateTo'),
      type: 'date',
    },
  ];

  return (
    <section
      className="rounded-xl border border-border bg-card p-3.5 sm:p-4"
      aria-label={t('common.filters')}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <label htmlFor="item-search" className="sr-only">
            {t('common.search')}
          </label>
          <Search
            className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            id="item-search"
            type="text"
            value={values.q}
            onChange={(event) => onChange({ q: event.target.value })}
            placeholder={t('lostFound.searchPlaceholder')}
            className={cn(
              primaryControlClass,
              'w-full ps-10',
              values.q ? 'pe-9' : 'pe-3.5',
            )}
          />
          {values.q ? (
            <button
              type="button"
              onClick={() => onChange({ q: '' })}
              aria-label={t('lostFound.clearSearch')}
              className="absolute end-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 lg:flex-nowrap">
          <div
            role="group"
            aria-label={t('lostFound.filterByType')}
            className="inline-flex h-10 shrink-0 items-center rounded-lg border border-border/80 bg-secondary/55 p-1"
          >
            {(['ALL', ...REPORT_TYPES] as const).map((typeOption) => {
              const selected = values.reportType === typeOption;
              const label =
                typeOption === 'ALL' ? t('common.all') : enumLabel('reportType', typeOption);
              return (
                <button
                  key={typeOption}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onChange({ reportType: typeOption })}
                  className={cn(
                    'h-8 rounded-md px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    selected
                      ? 'bg-card text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="min-w-[150px] flex-1 sm:w-44 sm:flex-none lg:w-48">
            <label htmlFor="item-category" className="sr-only">
              {t('common.category')}
            </label>
            <select
              id="item-category"
              value={values.category}
              onChange={(event) =>
                onChange({ category: event.target.value as ItemFilterState['category'] })
              }
              className={cn(primaryControlClass, 'w-full px-3')}
            >
              <option value="ALL">{t('lostFound.allCategories')}</option>
              {LOST_FOUND_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {enumLabel('lostFoundCategory', category)}
                </option>
              ))}
            </select>
          </div>

          <Button
            type="button"
            variant={showAdvanced ? 'secondary' : 'outline'}
            onClick={() => setShowAdvanced((open) => !open)}
            aria-expanded={showAdvanced}
            aria-controls="item-advanced-filters"
            className={cn(
              'h-10 shrink-0 gap-2 rounded-md border-input px-3.5 text-sm font-medium',
              advancedCount > 0 &&
                !showAdvanced &&
                'border-primary/40 bg-secondary/45 text-foreground',
            )}
          >
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span>{t('lostFound.moreFilters')}</span>
            {advancedCount > 0 ? (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold tabular-nums text-primary-foreground">
                {formatNumber(advancedCount)}
              </span>
            ) : null}
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 text-muted-foreground transition-transform duration-150',
                showAdvanced && 'rotate-180',
              )}
              aria-hidden="true"
            />
          </Button>
        </div>
      </div>

      {!showAdvanced && advancedCount > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
          {advancedChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={chip.onClear}
              aria-label={t('lostFound.removeFilter', { label: chip.text })}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/50 py-1 ps-3 pe-2 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span dir="auto">{chip.text}</span>
              <X className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            </button>
          ))}
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <RotateCcw className="h-3 w-3" aria-hidden="true" />
            <span>{t('common.clearFilters')}</span>
          </button>
        </div>
      ) : null}

      {showAdvanced ? (
        <div id="item-advanced-filters" className="mt-3.5 border-t border-border/75 pt-3.5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label htmlFor="item-status" className={secondaryLabelClass}>
                {t('common.status')}
              </label>
              <select
                id="item-status"
                value={values.status}
                onChange={(event) =>
                  onChange({ status: event.target.value as ItemFilterState['status'] })
                }
                className={secondaryControlClass}
              >
                <option value="ALL">{t('lostFound.allStatuses')}</option>
                {allowedStatuses.map((status) => (
                  <option key={status} value={status}>
                    {enumLabel('status', status)}
                  </option>
                ))}
              </select>
            </div>

            {secondaryFields.map((field) => (
              <div key={field.id}>
                <label htmlFor={field.id} className={secondaryLabelClass}>
                  {field.label}
                </label>
                <input
                  id={field.id}
                  type={field.type}
                  value={values[field.key]}
                  onChange={(event) => onChange({ [field.key]: event.target.value })}
                  placeholder={field.placeholder}
                  className={secondaryControlClass}
                />
              </div>
            ))}
          </div>

          {hasAnyFilter ? (
            <div className="mt-3 flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onReset}
                className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                {t('common.clearFilters')}
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
