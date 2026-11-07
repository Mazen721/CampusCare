import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ReportType } from '@/types/lostFound';

const REPORT_TYPE_STYLES: Record<ReportType, string> = {
  LOST: 'border-rose-300 bg-rose-50 text-rose-800',
  FOUND: 'border-teal-300 bg-teal-50 text-teal-900',
};

interface ReportTypeBadgeProps {
  reportType: ReportType;
  className?: string;
}

export function ReportTypeBadge({ reportType, className }: ReportTypeBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn('font-semibold uppercase tracking-wide', REPORT_TYPE_STYLES[reportType], className)}
    >
      {reportType}
    </Badge>
  );
}
