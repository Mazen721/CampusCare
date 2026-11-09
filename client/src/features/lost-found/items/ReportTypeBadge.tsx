import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { enumLabel } from '@/lib/labels';
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
  useTranslation();
  return (
    <Badge
      variant="outline"
      className={cn('font-semibold uppercase tracking-wide', REPORT_TYPE_STYLES[reportType], className)}
    >
      {enumLabel('reportType', reportType)}
    </Badge>
  );
}
