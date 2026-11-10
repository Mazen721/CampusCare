import { AlertOctagon, AlertTriangle, Minus, MoveDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { enumLabel } from '@/lib/labels';
import { cn } from '@/lib/utils';

const PRIORITY_STYLES = {
  CRITICAL: {
    className: 'border-destructive bg-destructive text-destructive-foreground',
    iconClassName: '',
    Icon: AlertOctagon,
  },
  HIGH: {
    className:
      'border-[hsl(var(--badge-warn-border)/0.6)] bg-[hsl(var(--badge-warn-bg))] text-[hsl(var(--badge-warn-fg))]',
    iconClassName: 'text-[hsl(var(--badge-warn-icon))]',
    Icon: AlertTriangle,
  },
  MEDIUM: {
    className: 'border-border bg-secondary text-secondary-foreground',
    iconClassName: 'text-muted-foreground',
    Icon: Minus,
  },
  LOW: {
    className: 'border-border bg-card text-muted-foreground',
    iconClassName: 'text-muted-foreground',
    Icon: MoveDown,
  },
} as const;

type Priority = keyof typeof PRIORITY_STYLES;

interface PriorityBadgeProps {
  priority: string;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  useTranslation();
  const key = (priority.toUpperCase() as Priority) in PRIORITY_STYLES ? (priority.toUpperCase() as Priority) : 'MEDIUM';
  const style = PRIORITY_STYLES[key];
  const Icon = style.Icon;

  return (
    <Badge
      variant="outline"
      className={cn('gap-1 font-semibold ltr:uppercase ltr:tracking-wide', style.className, className)}
    >
      <Icon className={cn('h-3 w-3', style.iconClassName)} aria-hidden="true" />
      {enumLabel('priority', key)}
    </Badge>
  );
}
