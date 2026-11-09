import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { enumLabel } from '@/lib/labels';
import { cn } from '@/lib/utils';

interface StatusStyle {
  className: string;
  dotClassName: string;
}

const STATUS_STYLES: Record<string, StatusStyle> = {
  SUBMITTED: {
    className: 'border-stone-300 bg-stone-100 text-stone-800',
    dotClassName: 'bg-stone-500',
  },
  UNDER_REVIEW: {
    className: 'border-amber-300 bg-amber-50 text-amber-900',
    dotClassName: 'bg-amber-500',
  },
  APPROVED: {
    className: 'border-teal-300 bg-teal-50 text-teal-900',
    dotClassName: 'bg-teal-600',
  },
  REJECTED: {
    className: 'border-red-300 bg-red-50 text-red-800',
    dotClassName: 'bg-red-600',
  },
  IN_PROGRESS: {
    className: 'border-sky-300 bg-sky-50 text-sky-900',
    dotClassName: 'bg-sky-600',
  },
  COMPLETED: {
    className: 'border-emerald-300 bg-emerald-50 text-emerald-900',
    dotClassName: 'bg-emerald-600',
  },
  CLOSED: {
    className: 'border-stone-300 bg-stone-100 text-stone-700',
    dotClassName: 'bg-stone-500',
  },
  REOPENED: {
    className: 'border-orange-300 bg-orange-50 text-orange-900',
    dotClassName: 'bg-orange-600',
  },
  PENDING_ASSIGNMENT: {
    className: 'border-amber-300 bg-amber-50 text-amber-900',
    dotClassName: 'bg-amber-500',
  },
  ASSIGNED: {
    className: 'border-teal-300 bg-teal-50 text-teal-900',
    dotClassName: 'bg-teal-600',
  },
  CANCELLED: {
    className: 'border-stone-300 bg-stone-100 text-stone-600',
    dotClassName: 'bg-stone-400',
  },
  OPEN: {
    className: 'border-teal-300 bg-teal-50 text-teal-900',
    dotClassName: 'bg-teal-600',
  },
  MATCH_CONFIRMED: {
    className: 'border-indigo-300 bg-indigo-50 text-indigo-900',
    dotClassName: 'bg-indigo-600',
  },
  CLAIM_UNDER_REVIEW: {
    className: 'border-amber-300 bg-amber-50 text-amber-900',
    dotClassName: 'bg-amber-500',
  },
  APPROVED_FOR_HANDOVER: {
    className: 'border-emerald-300 bg-emerald-50 text-emerald-900',
    dotClassName: 'bg-emerald-600',
  },
  RETURNED: {
    className: 'border-emerald-300 bg-emerald-50 text-emerald-900',
    dotClassName: 'bg-emerald-600',
  },
  PENDING_REVIEW: {
    className: 'border-amber-300 bg-amber-50 text-amber-900',
    dotClassName: 'bg-amber-500',
  },
  UNDER_VERIFICATION: {
    className: 'border-amber-300 bg-amber-50 text-amber-900',
    dotClassName: 'bg-amber-500',
  },
  SUGGESTED: {
    className: 'border-amber-300 bg-amber-50 text-amber-900',
    dotClassName: 'bg-amber-500',
  },
  CONFIRMED: {
    className: 'border-emerald-300 bg-emerald-50 text-emerald-900',
    dotClassName: 'bg-emerald-600',
  },
  DISMISSED: {
    className: 'border-stone-300 bg-stone-100 text-stone-600',
    dotClassName: 'bg-stone-400',
  },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  useTranslation();
  const key = status.toUpperCase();
  const style = STATUS_STYLES[key] ?? {
    className: 'border-stone-300 bg-stone-100 text-stone-700',
    dotClassName: 'bg-stone-500',
  };

  return (
    <Badge variant="outline" className={cn('font-medium', style.className, className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', style.dotClassName)} aria-hidden="true" />
      {enumLabel('status', key)}
    </Badge>
  );
}
