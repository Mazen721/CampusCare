import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { formatDate } from '@/lib/utils';

interface PortalLedgerRowProps {
  to: string;
  title: string;
  code: string;
  date?: Date | string;
  metaItems?: string[];
  location?: string;
  badges: ReactNode;
}

/**
 * Full-row interactive ledger item that wraps mixed-script titles cleanly
 * on narrow viewports with `dir="auto"` while isolating LTR codes and dates.
 */
export function PortalLedgerRow({
  to,
  title,
  code,
  date,
  metaItems,
  location,
  badges,
}: PortalLedgerRowProps) {
  const details = [...(metaItems ?? []), ...(date ? [formatDate(date)] : [])].filter(Boolean);

  return (
    <li className="py-1 first:pt-0 last:pb-0">
      <Link
        to={to}
        className="group -mx-2 flex flex-col gap-2 rounded-lg px-2 py-2.5 transition-colors hover:bg-secondary/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-row sm:items-center sm:justify-between sm:gap-3"
      >
        <div className="min-w-0 flex-1">
          <span
            dir="auto"
            className="line-clamp-2 block text-start text-sm font-medium leading-snug text-foreground transition-colors group-hover:text-primary sm:truncate"
          >
            {title}
          </span>
          <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground">
            <span dir="ltr" className="font-mono tabular-nums">
              {code}
            </span>
            {details.map((detail, index) => (
              <span key={`${index}-${detail}`} className="inline-flex items-center gap-1.5">
                <span aria-hidden="true">·</span>
                <bdi className="tabular-nums">{detail}</bdi>
              </span>
            ))}
          </p>
          {location ? (
            <p dir="auto" className="mt-0.5 truncate text-start text-xs text-muted-foreground">
              {location}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-1.5">{badges}</div>
      </Link>
    </li>
  );
}
