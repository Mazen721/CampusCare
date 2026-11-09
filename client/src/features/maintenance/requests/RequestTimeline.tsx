import { Check, Circle, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { RequestStatus } from '@/types/meta';

interface TimelineStep {
  status: string;
  labelKey: string;
  descriptionKey: string;
}

const FLOW_STEPS: TimelineStep[] = [
  { status: 'SUBMITTED', labelKey: 'requests.stepSubmitted', descriptionKey: 'requests.stepSubmittedDesc' },
  { status: 'UNDER_REVIEW', labelKey: 'requests.stepUnderReview', descriptionKey: 'requests.stepUnderReviewDesc' },
  { status: 'APPROVED', labelKey: 'requests.stepApproved', descriptionKey: 'requests.stepApprovedDesc' },
  { status: 'IN_PROGRESS', labelKey: 'requests.stepInProgress', descriptionKey: 'requests.stepInProgressDesc' },
  { status: 'COMPLETED', labelKey: 'requests.stepCompleted', descriptionKey: 'requests.stepCompletedDesc' },
  { status: 'CLOSED', labelKey: 'requests.stepClosed', descriptionKey: 'requests.stepClosedDesc' },
];

const STEP_INDEX: Record<RequestStatus, number> = {
  SUBMITTED: 0,
  UNDER_REVIEW: 1,
  APPROVED: 2,
  IN_PROGRESS: 3,
  COMPLETED: 4,
  CLOSED: 5,
  REOPENED: 5,
  REJECTED: 2,
};

interface RequestTimelineProps {
  status: RequestStatus;
  className?: string;
}

export function RequestTimeline({ status, className }: RequestTimelineProps) {
  const { t } = useTranslation();
  const isRejected = status === 'REJECTED';
  const isReopened = status === 'REOPENED';
  const steps: TimelineStep[] = isRejected
    ? [
        ...FLOW_STEPS.slice(0, 2),
        { status: 'REJECTED', labelKey: 'requests.stepRejected', descriptionKey: 'requests.stepRejectedDesc' },
      ]
    : isReopened
      ? [
          ...FLOW_STEPS.slice(0, 5),
          { status: 'REOPENED', labelKey: 'requests.stepReopened', descriptionKey: 'requests.stepReopenedDesc' },
        ]
      : FLOW_STEPS;
  const currentIndex = STEP_INDEX[status];

  return (
    <Card className={className}>
      <CardHeader className="border-b">
        <CardTitle>{t('requests.progress')}</CardTitle>
      </CardHeader>
      <CardContent className="pt-5">
        <ol className="space-y-0">
          {steps.map((step, index) => {
            const isComplete = index < currentIndex;
            const isCurrent = index === currentIndex;
            const isRejectedStep = isRejected && step.status === 'REJECTED';
            const isLast = index === steps.length - 1;

            return (
              <li key={step.status} className="relative flex gap-3 pb-5 last:pb-0">
                {!isLast ? (
                  <span
                    className={cn(
                      'absolute start-[9px] top-5 h-[calc(100%-12px)] w-px',
                      isComplete ? 'bg-primary/40' : 'bg-border',
                    )}
                    aria-hidden="true"
                  />
                ) : null}
                <span
                  className={cn(
                    'relative z-10 mt-0.5 flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full border',
                    isRejectedStep
                      ? 'border-destructive bg-destructive text-destructive-foreground'
                      : isComplete || isCurrent
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-card text-muted-foreground',
                  )}
                >
                  {isRejectedStep ? (
                    <X className="h-3 w-3" aria-hidden="true" />
                  ) : isComplete ? (
                    <Check className="h-3 w-3" aria-hidden="true" />
                  ) : (
                    <Circle className="h-1.5 w-1.5 fill-current" aria-hidden="true" />
                  )}
                </span>
                <div className="min-w-0">
                  <p
                    className={cn(
                      'text-sm leading-tight',
                      isRejectedStep
                        ? 'font-semibold text-destructive'
                        : isCurrent
                          ? 'font-semibold text-foreground'
                          : isComplete
                            ? 'font-medium text-foreground'
                            : 'text-muted-foreground',
                    )}
                  >
                    {t(step.labelKey)}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{t(step.descriptionKey)}</p>
                </div>
              </li>
            );
          })}
        </ol>
        {status === 'REOPENED' ? (
          <p className="mt-4 rounded-md border border-orange-200 bg-orange-50 px-3 py-2 text-xs leading-relaxed text-orange-900">
            {t('requests.reopenedNotice')}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
