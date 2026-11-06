import { Check, Circle, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { RequestStatus } from '@/types/meta';

interface TimelineStep {
  status: string;
  label: string;
  description: string;
}

const FLOW_STEPS: TimelineStep[] = [
  { status: 'SUBMITTED', label: 'Submitted', description: 'Request received' },
  { status: 'UNDER_REVIEW', label: 'Under review', description: 'Manager triage' },
  { status: 'APPROVED', label: 'Approved', description: 'Work order created' },
  { status: 'IN_PROGRESS', label: 'In progress', description: 'Technician working' },
  { status: 'COMPLETED', label: 'Completed', description: 'Awaiting confirmation' },
  { status: 'CLOSED', label: 'Closed', description: 'Request resolved' },
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
  const isRejected = status === 'REJECTED';
  const isReopened = status === 'REOPENED';
  const steps = isRejected
    ? [
        ...FLOW_STEPS.slice(0, 2),
        { status: 'REJECTED', label: 'Rejected', description: 'No work order created' },
      ]
    : isReopened
      ? [
          ...FLOW_STEPS.slice(0, 5),
          { status: 'REOPENED', label: 'Reopened', description: 'Reopened after completion' },
        ]
      : FLOW_STEPS;
  const currentIndex = STEP_INDEX[status];

  return (
    <Card className={className}>
      <CardHeader className="border-b">
        <CardTitle>Progress</CardTitle>
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
                      'absolute left-[9px] top-5 h-[calc(100%-12px)] w-px',
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
                    {step.label}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{step.description}</p>
                </div>
              </li>
            );
          })}
        </ol>
        {status === 'REOPENED' ? (
          <p className="mt-4 rounded-md border border-orange-200 bg-orange-50 px-3 py-2 text-xs leading-relaxed text-orange-900">
            This request was reopened after completion and is back with the technician.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
