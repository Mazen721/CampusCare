import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertCircle,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  Search,
  XCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { requestsApi } from '@/features/maintenance/requests/requestsApi';
import { useTranslation } from 'react-i18next';
import { getErrorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { MaintenanceRequestRecord, ReviewAction } from '@/types/maintenance';

const reviewSchema = z
  .object({
    action: z.enum(['UNDER_REVIEW', 'APPROVE', 'REJECT']),
    notes: z
      .string()
      .trim()
      .max(2000, 'Notes must be 2000 characters or fewer')
      .optional(),
  })
  .superRefine((values, context) => {
    if (values.action === 'REJECT' && !values.notes) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['notes'],
        message: 'A reason is required when rejecting a request',
      });
    }
  });

type ReviewValues = z.infer<typeof reviewSchema>;

const ACTIONS: Array<{
  value: ReviewAction;
  labelKey: string;
  descKey: string;
  Icon: LucideIcon;
}> = [
  {
    value: 'UNDER_REVIEW',
    labelKey: 'requests.markUnderReview',
    descKey: 'requests.markUnderReviewDesc',
    Icon: Search,
  },
  {
    value: 'APPROVE',
    labelKey: 'requests.approve',
    descKey: 'requests.approveDesc',
    Icon: CheckCircle2,
  },
  {
    value: 'REJECT',
    labelKey: 'requests.reject',
    descKey: 'requests.rejectDesc',
    Icon: XCircle,
  },
];

function defaultAction(request: MaintenanceRequestRecord): ReviewAction {
  return request.status === 'UNDER_REVIEW' ? 'APPROVE' : 'UNDER_REVIEW';
}

interface ReviewRequestDialogProps {
  request: MaintenanceRequestRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReviewed?: (request: MaintenanceRequestRecord) => void;
}

export function ReviewRequestDialog({
  request,
  open,
  onOpenChange,
  onReviewed,
}: ReviewRequestDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ReviewValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { action: 'UNDER_REVIEW', notes: '' },
  });

  useEffect(() => {
    if (!open || !request) return;
    setServerError(null);
    reset({ action: defaultAction(request), notes: '' });
  }, [open, request, reset]);

  const reviewRequest = useMutation({
    mutationFn: (values: ReviewValues) => {
      if (!request) throw new Error('No request selected');
      return requestsApi.review(request.id, {
        action: values.action,
        notes: values.notes || undefined,
      });
    },
    onSuccess: async (result, values) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['requests'] }),
        queryClient.invalidateQueries({ queryKey: ['request', result.request.id] }),
        queryClient.invalidateQueries({ queryKey: ['notifications'] }),
      ]);

      if (values.action === 'APPROVE') {
        toast.success(
          result.workOrder
            ? `Request approved. Work order ${result.workOrder.workOrderNumber} created.`
            : 'Request approved.',
        );
      } else if (values.action === 'REJECT') {
        toast.success('Request rejected. The requester has been notified.');
      } else {
        toast.success('Request moved under review.');
      }

      onReviewed?.(result.request);
      onOpenChange(false);
    },
    onError: (error) => {
      setServerError(getErrorMessage(error, 'Unable to review this request. Please try again.'));
    },
  });

  const action = watch('action');
  const notes = watch('notes') ?? '';

  const submitLabel =
    action === 'APPROVE'
      ? t('requests.confirmApprove')
      : action === 'REJECT'
        ? t('requests.confirmReject')
        : t('requests.setUnderReview');

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => !reviewRequest.isPending && onOpenChange(nextOpen)}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {t('requests.reviewTitle')} <span dir="ltr">{request?.requestNumber}</span>
          </DialogTitle>
          <DialogDescription>
            {request?.title}{t('requests.reviewSubtitle')}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleSubmit((values) => reviewRequest.mutate(values))} noValidate>
          {serverError ? (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg border border-destructive/25 bg-destructive/5 px-3.5 py-3 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{serverError}</span>
            </div>
          ) : null}

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-foreground">{t('requests.decision')}</legend>
            <div className="space-y-2">
              {ACTIONS.map((option) => {
                const Icon = option.Icon;
                const selected = action === option.value;
                return (
                  <label
                    key={option.value}
                    className={cn(
                      'flex cursor-pointer items-start gap-3 rounded-lg border px-3.5 py-3 transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background',
                      selected ? 'border-primary bg-primary/5' : 'bg-card hover:bg-accent/50',
                    )}
                  >
                    <input
                      type="radio"
                      value={option.value}
                      className="sr-only"
                      {...register('action')}
                    />
                    <Icon
                      className={cn(
                        'mt-0.5 h-5 w-5 shrink-0',
                        selected ? 'text-primary' : 'text-muted-foreground',
                      )}
                      strokeWidth={1.8}
                      aria-hidden="true"
                    />
                    <span>
                      <span className="block text-sm font-medium text-foreground">
                        {t(option.labelKey)}
                      </span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                        {t(option.descKey)}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {action === 'APPROVE' ? (
            <div className="flex items-start gap-2.5 rounded-lg border border-teal-200 bg-teal-50 px-3.5 py-3 text-xs leading-relaxed text-teal-900">
              <ClipboardCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <p>
                {t('requests.approveNotice')}

              </p>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="review-notes">
              {action === 'REJECT' ? t('requests.reasonForRejection') : t('requests.reviewNotes')}
              {action === 'REJECT' ? (
                <span className="ms-1 text-destructive" aria-hidden="true">
                  *
                </span>
              ) : null}
            </Label>
            <Textarea
              id="review-notes"
              placeholder={
                action === 'REJECT'
                  ? 'Explain what is missing or why this request cannot proceed.'
                  : 'Optional context for the requester or technician.'
              }
              maxLength={2000}
              aria-invalid={Boolean(errors.notes)}
              {...register('notes')}
            />
            <div className="flex items-center justify-between gap-3">
              {errors.notes ? (
                <p className="text-xs font-medium text-destructive" role="alert">
                  {errors.notes.message}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {action === 'REJECT'
                    ? 'The requester can read this reason.'
                    : 'Visible to the requester on the request detail.'}
                </p>
              )}
              <p className="text-[11px] text-muted-foreground">{notes.length}/2000</p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={reviewRequest.isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              variant={action === 'REJECT' ? 'destructive' : 'default'}
              disabled={isSubmitting || reviewRequest.isPending}
            >
              {isSubmitting || reviewRequest.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : null}
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
