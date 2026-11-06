import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusStyle {
  label: string;
  className: string;
  dotClassName: string;
}

const STATUS_STYLES: Record<string, StatusStyle> = {
  SUBMITTED: {
    label: 'Submitted',
    className: 'border-stone-300 bg-stone-100 text-stone-800',
    dotClassName: 'bg-stone-500',
  },
  UNDER_REVIEW: {
    label: 'Under review',
    className: 'border-amber-300 bg-amber-50 text-amber-900',
    dotClassName: 'bg-amber-500',
  },
  APPROVED: {
    label: 'Approved',
    className: 'border-teal-300 bg-teal-50 text-teal-900',
    dotClassName: 'bg-teal-600',
  },
  REJECTED: {
    label: 'Rejected',
    className: 'border-red-300 bg-red-50 text-red-800',
    dotClassName: 'bg-red-600',
  },
  IN_PROGRESS: {
    label: 'In progress',
    className: 'border-sky-300 bg-sky-50 text-sky-900',
    dotClassName: 'bg-sky-600',
  },
  COMPLETED: {
    label: 'Completed',
    className: 'border-emerald-300 bg-emerald-50 text-emerald-900',
    dotClassName: 'bg-emerald-600',
  },
  CLOSED: {
    label: 'Closed',
    className: 'border-stone-300 bg-stone-100 text-stone-700',
    dotClassName: 'bg-stone-500',
  },
  REOPENED: {
    label: 'Reopened',
    className: 'border-orange-300 bg-orange-50 text-orange-900',
    dotClassName: 'bg-orange-600',
  },
  PENDING_ASSIGNMENT: {
    label: 'Pending assignment',
    className: 'border-amber-300 bg-amber-50 text-amber-900',
    dotClassName: 'bg-amber-500',
  },
  ASSIGNED: {
    label: 'Assigned',
    className: 'border-teal-300 bg-teal-50 text-teal-900',
    dotClassName: 'bg-teal-600',
  },
  CANCELLED: {
    label: 'Cancelled',
    className: 'border-stone-300 bg-stone-100 text-stone-600',
    dotClassName: 'bg-stone-400',
  },
  OPEN: {
    label: 'Open',
    className: 'border-teal-300 bg-teal-50 text-teal-900',
    dotClassName: 'bg-teal-600',
  },
  MATCH_CONFIRMED: {
    label: 'Match confirmed',
    className: 'border-indigo-300 bg-indigo-50 text-indigo-900',
    dotClassName: 'bg-indigo-600',
  },
  CLAIM_UNDER_REVIEW: {
    label: 'Claim under review',
    className: 'border-amber-300 bg-amber-50 text-amber-900',
    dotClassName: 'bg-amber-500',
  },
  APPROVED_FOR_HANDOVER: {
    label: 'Approved for handover',
    className: 'border-emerald-300 bg-emerald-50 text-emerald-900',
    dotClassName: 'bg-emerald-600',
  },
  RETURNED: {
    label: 'Returned',
    className: 'border-emerald-300 bg-emerald-50 text-emerald-900',
    dotClassName: 'bg-emerald-600',
  },
  PENDING_REVIEW: {
    label: 'Pending review',
    className: 'border-amber-300 bg-amber-50 text-amber-900',
    dotClassName: 'bg-amber-500',
  },
  UNDER_VERIFICATION: {
    label: 'Under verification',
    className: 'border-amber-300 bg-amber-50 text-amber-900',
    dotClassName: 'bg-amber-500',
  },
  SUGGESTED: {
    label: 'Suggested',
    className: 'border-amber-300 bg-amber-50 text-amber-900',
    dotClassName: 'bg-amber-500',
  },
  CONFIRMED: {
    label: 'Confirmed',
    className: 'border-emerald-300 bg-emerald-50 text-emerald-900',
    dotClassName: 'bg-emerald-600',
  },
  DISMISSED: {
    label: 'Dismissed',
    className: 'border-stone-300 bg-stone-100 text-stone-600',
    dotClassName: 'bg-stone-400',
  },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const key = status.toUpperCase();
  const style = STATUS_STYLES[key] ?? {
    label: key.replaceAll('_', ' ').toLowerCase().replace(/^\w/, (letter) => letter.toUpperCase()),
    className: 'border-stone-300 bg-stone-100 text-stone-700',
    dotClassName: 'bg-stone-500',
  };

  return (
    <Badge variant="outline" className={cn('font-medium', style.className, className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', style.dotClassName)} aria-hidden="true" />
      {style.label}
    </Badge>
  );
}
