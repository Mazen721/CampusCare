import { AlertOctagon, AlertTriangle, Minus, MoveDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { enumLabel } from '@/lib/labels';
import { cn } from '@/lib/utils';

const PRIORITY_STYLES = {
  CRITICAL: {
    className: 'border-red-800 bg-red-700 text-white',
    Icon: AlertOctagon,
  },
  HIGH: {
    className: 'border-amber-600 bg-amber-400 text-stone-950',
    Icon: AlertTriangle,
  },
  MEDIUM: {
    className: 'border-stone-300 bg-stone-100 text-stone-800',
    Icon: Minus,
  },
  LOW: {
    className: 'border-stone-200 bg-white text-stone-600',
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
      className={cn('gap-1 font-semibold uppercase tracking-wide', style.className, className)}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {enumLabel('priority', key)}
    </Badge>
  );
}
