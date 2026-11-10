import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { enumLabel } from '@/lib/labels';
import { cn } from '@/lib/utils';

interface StatusStyle {
  className: string;
  dotClassName: string;
}

const WARN_STYLE: StatusStyle = {
  className:
    'border-[hsl(var(--badge-warn-border)/0.6)] bg-[hsl(var(--badge-warn-bg))] text-[hsl(var(--badge-warn-fg))]',
  dotClassName: 'bg-[hsl(var(--badge-warn-icon))]',
};

const ACTIVE_STYLE: StatusStyle = {
  className: 'border-border bg-secondary text-secondary-foreground',
  dotClassName: 'bg-primary',
};

const COMPLETE_STYLE: StatusStyle = {
  className: 'border-primary/30 bg-primary/10 text-primary',
  dotClassName: 'bg-primary',
};

const MUTED_STYLE: StatusStyle = {
  className: 'border-border bg-muted text-muted-foreground',
  dotClassName: 'bg-muted-foreground',
};

const QUIET_STYLE: StatusStyle = {
  className: 'border-border bg-card text-muted-foreground',
  dotClassName: 'bg-muted-foreground/70',
};

const DANGER_STYLE: StatusStyle = {
  className: 'border-destructive/30 bg-destructive/10 text-destructive',
  dotClassName: 'bg-destructive',
};

const STATUS_STYLES: Record<string, StatusStyle> = {
  SUBMITTED: ACTIVE_STYLE,
  UNDER_REVIEW: WARN_STYLE,
  APPROVED: ACTIVE_STYLE,
  REJECTED: DANGER_STYLE,
  IN_PROGRESS: WARN_STYLE,
  COMPLETED: COMPLETE_STYLE,
  CLOSED: MUTED_STYLE,
  REOPENED: WARN_STYLE,
  PENDING_ASSIGNMENT: WARN_STYLE,
  ASSIGNED: ACTIVE_STYLE,
  CANCELLED: QUIET_STYLE,
  OPEN: ACTIVE_STYLE,
  MATCH_CONFIRMED: COMPLETE_STYLE,
  CLAIM_UNDER_REVIEW: WARN_STYLE,
  APPROVED_FOR_HANDOVER: COMPLETE_STYLE,
  RETURNED: COMPLETE_STYLE,
  PENDING_REVIEW: WARN_STYLE,
  UNDER_VERIFICATION: WARN_STYLE,
  SUGGESTED: WARN_STYLE,
  CONFIRMED: COMPLETE_STYLE,
  DISMISSED: QUIET_STYLE,
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  useTranslation();
  const key = status.toUpperCase();
  const style = STATUS_STYLES[key] ?? {
    className: 'border-border bg-secondary text-secondary-foreground',
    dotClassName: 'bg-muted-foreground',
  };

  return (
    <Badge variant="outline" className={cn('font-medium', style.className, className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', style.dotClassName)} aria-hidden="true" />
      {enumLabel('status', key)}
    </Badge>
  );
}
