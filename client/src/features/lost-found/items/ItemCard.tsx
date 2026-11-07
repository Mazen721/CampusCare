import { CalendarDays, ImageOff, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ReportTypeBadge } from '@/features/lost-found/items/ReportTypeBadge';
import { formatDate } from '@/lib/utils';
import type { LostFoundItem } from '@/types/lostFound';

interface ItemCardProps {
  item: LostFoundItem;
}

export function ItemCard({ item }: ItemCardProps) {
  const image = item.images[0];

  return (
    <Link
      to={`/lost-found/items/${item.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border bg-card shadow-panel transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-muted">
        {image ? (
          <img
            src={image.url}
            alt={`Photo of ${item.itemTitle}`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <ImageOff className="h-7 w-7" strokeWidth={1.6} aria-hidden="true" />
            <span className="text-[11px] font-medium">No photo</span>
          </div>
        )}
        <div className="absolute left-2.5 top-2.5">
          <ReportTypeBadge reportType={item.reportType} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="space-y-1">
          <p className="font-mono text-[11px] font-semibold text-primary">
            {item.reportNumber}
          </p>
          <h2 className="line-clamp-2 font-display text-lg leading-snug text-foreground group-hover:text-primary">
            {item.itemTitle}
          </h2>
          <p className="text-xs text-muted-foreground">{item.category}</p>
        </div>

        <div className="mt-auto space-y-2 text-xs text-muted-foreground">
          <p className="flex items-start gap-1.5">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
            <span className="line-clamp-2">
              {item.location
                ? `${item.location.buildingName} · ${item.location.floor} · ${item.location.room}`
                : item.locationDetails}
            </span>
          </p>
          <p className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
            {formatDate(item.occurrenceDate)}
          </p>
        </div>

        <StatusBadge status={item.status} className="w-fit" />
      </div>
    </Link>
  );
}
