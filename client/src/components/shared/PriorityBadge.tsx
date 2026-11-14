import { AlertOctagon, AlertTriangle, Minus, MoveDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { enumLabel } from '@/lib/labels';
import { cn } from '@/lib/utils';

const PRIORITY_STYLES = {
  CRITICAL: {
    className: 'border-destructive/25 bg-destructive/10 text-destructive',
    iconClassName: 'text-destructive',
    Icon: AlertOctagon,
  },
  HIGH: {
    className: 'border-destructive/25 bg-destructive/10 text-destructive',
    iconClassName: 'text-destructive',
    Icon: AlertTriangle,
  },
  MEDIUM: {
    className: 'border-amber-500/30 bg-amber-500/[0.12] text-amber-800',
    iconClassName: 'text-amber-700',
    Icon: Minus,
  },
  LOW: {
    className: 'border-primary/20 bg-primary/[0.08] text-primary',
    iconClassName: 'text-primary',
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
