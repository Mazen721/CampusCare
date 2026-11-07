import { RotateCcw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { humanizeEnum } from '@/lib/labels';
import {
  ITEM_STATUSES,
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
}

const fieldClass =
  'h-9 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';
const labelClass =
  'mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground';

export function ItemFilters({ values, onChange, onReset }: ItemFiltersProps) {
  return (
    <section className="rounded-lg border bg-card p-4 shadow-panel" aria-label="Lost and found filters">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="md:col-span-2">
          <label htmlFor="item-search" className={labelClass}>
            Search
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              id="item-search"
              type="search"
              value={values.q}
              onChange={(event) => onChange({ q: event.target.value })}
              placeholder="Report number, title or description…"
              className={`${fieldClass} pl-9`}
            />
          </div>
        </div>

        <div>
          <label htmlFor="item-type" className={labelClass}>
            Report type
          </label>
          <select
            id="item-type"
            value={values.reportType}
            onChange={(event) =>
              onChange({ reportType: event.target.value as ItemFilterState['reportType'] })
            }
            className={fieldClass}
          >
            <option value="ALL">Lost and found</option>
            {REPORT_TYPES.map((type) => (
              <option key={type} value={type}>
                {humanizeEnum(type)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="item-category" className={labelClass}>
            Category
          </label>
          <select
            id="item-category"
            value={values.category}
            onChange={(event) =>
              onChange({ category: event.target.value as ItemFilterState['category'] })
            }
            className={fieldClass}
          >
            <option value="ALL">All categories</option>
            {LOST_FOUND_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="item-building" className={labelClass}>
            Building
          </label>
          <input
            id="item-building"
            type="text"
            value={values.building}
            onChange={(event) => onChange({ building: event.target.value })}
            placeholder="e.g. Engineering"
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="item-color" className={labelClass}>
            Colour
          </label>
          <input
            id="item-color"
            type="text"
            value={values.color}
            onChange={(event) => onChange({ color: event.target.value })}
            placeholder="e.g. Black"
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="item-brand" className={labelClass}>
            Brand
          </label>
          <input
            id="item-brand"
            type="text"
            value={values.brand}
            onChange={(event) => onChange({ brand: event.target.value })}
            placeholder="e.g. North Face"
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="item-status" className={labelClass}>
            Status
          </label>
          <select
            id="item-status"
            value={values.status}
            onChange={(event) =>
              onChange({ status: event.target.value as ItemFilterState['status'] })
            }
            className={fieldClass}
          >
            <option value="ALL">All statuses</option>
            {ITEM_STATUSES.map((status) => (
              <option key={status} value={status}>
                {humanizeEnum(status)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="item-from" className={labelClass}>
            Occurred from
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
            Occurred to
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
            Reset filters
          </Button>
        </div>
      </div>
    </section>
  );
}
