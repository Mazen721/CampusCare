import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { FormField } from '@/components/shared/FormField';
import { ImageUpload } from '@/components/shared/ImageUpload';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  createClaimFormSchema,
  type ClaimFormValues,
} from '@/features/lost-found/claims/claimFormSchema';
import { claimsApi } from '@/features/lost-found/claims/claimsApi';
import { formatLocation, tr } from '@/i18n/localize';
import { getErrorMessage } from '@/lib/api';
import { enumLabel } from '@/lib/labels';
import { formatDate } from '@/lib/utils';
import type { LostFoundItem } from '@/types/lostFound';

const selectClass =
  'h-10 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

interface ClaimFormProps {
  claimableItems: LostFoundItem[];
  foundItem: LostFoundItem | null;
  lostReports: LostFoundItem[];
  defaultLinkedLostItemId?: string;
}

export function ClaimForm({
  claimableItems,
  foundItem,
  lostReports,
  defaultLinkedLostItemId,
}: ClaimFormProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [images, setImages] = useState<File[]>([]);

  const schema = useMemo(() => createClaimFormSchema(t), [t]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClaimFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      itemId: foundItem?.id ?? '',
      claimDescription: '',
      identifyingDetailsProvided: '',
      linkedLostItemId: defaultLinkedLostItemId ?? '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (values: ClaimFormValues) =>
      claimsApi.create({
        itemId: values.itemId,
        claimDescription: values.claimDescription,
        identifyingDetailsProvided: values.identifyingDetailsProvided,
        linkedLostItemId: values.linkedLostItemId || undefined,
        images,
      }),
    onSuccess: ({ claim }) => {
      void queryClient.invalidateQueries({ queryKey: ['lost-found-claims'] });
      void queryClient.invalidateQueries({ queryKey: ['lost-found-item', claim.item?.id] });
      toast.success(t('claims.claimSubmittedSuccess'));
      navigate(`/lost-found/claims/${claim.id}`);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  return (
    <form
      className="space-y-6"
      onSubmit={handleSubmit((values) => createMutation.mutate(values))}
      noValidate
    >
      {foundItem ? (
        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="font-mono text-xs font-semibold text-primary">
            <span dir="ltr">{foundItem.reportNumber}</span>
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">{tr(foundItem, 'itemTitle')}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {enumLabel('lostFoundCategory', foundItem.category)} · {t('lostFound.foundOn')} {formatDate(foundItem.occurrenceDate)}
            {foundItem.location ? ` · ${formatLocation(foundItem.location)}` : ''}
          </p>
          <input type="hidden" {...register('itemId')} />
        </div>
      ) : (
        <FormField
          id="claim-item"
          label={t('claims.foundItemDetails')}
          error={errors.itemId?.message}
          hint={t('claims.foundItemSelectPrompt')}
          required
        >
          <select
            id="claim-item"
            className={selectClass}
            aria-invalid={Boolean(errors.itemId)}
            {...register('itemId')}
          >
            <option value="">{t('claims.foundItemSelectPrompt')}</option>
            {claimableItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.reportNumber} · {tr(item, 'itemTitle')}
              </option>
            ))}
          </select>
        </FormField>
      )}

      <FormField
        id="claim-description"
        label={t('claims.whyYours')}
        error={errors.claimDescription?.message}
        hint={t('claims.whyYoursHint')}
        required
      >
        <Textarea
          id="claim-description"
          rows={4}
          maxLength={4000}
          placeholder={t('claims.whyYoursPlaceholder')}
          aria-invalid={Boolean(errors.claimDescription)}
          {...register('claimDescription')}
        />
      </FormField>

      <div className="rounded-lg border border-amber-300/70 bg-amber-50 px-3.5 py-3">
        <FormField
          id="claim-identifying-details"
          label={t('claims.identifyingDetails')}
          error={errors.identifyingDetailsProvided?.message}
          hint={t('claims.privateDetailsProvidedHint')}
          required
        >
          <Textarea
            id="claim-identifying-details"
            rows={3}
            maxLength={4000}
            placeholder={t('claims.privateDetailsProvidedPlaceholder')}
            aria-invalid={Boolean(errors.identifyingDetailsProvided)}
            {...register('identifyingDetailsProvided')}
          />
        </FormField>
      </div>

      <FormField
        id="claim-linked-lost"
        label={t('claims.linkedLostItem')}
        error={errors.linkedLostItemId?.message}
        hint={t('claims.linkedLostHint')}
      >
        <select id="claim-linked-lost" className={selectClass} {...register('linkedLostItemId')}>
          <option value="">{t('claims.noLinkedLostOption')}</option>
          {lostReports.map((item) => (
            <option key={item.id} value={item.id}>
              {item.reportNumber} · {tr(item, 'itemTitle')}
            </option>
          ))}
        </select>
      </FormField>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-foreground">
          {t('claims.supportingEvidence')}{' '}
          <span className="font-normal text-muted-foreground">({t('common.optional')})</span>
        </legend>
        <ImageUpload files={images} onChange={setImages} maxFiles={3} />
      </fieldset>

      <div className="flex items-start gap-2.5 rounded-lg border border-teal-200 bg-teal-50/60 px-3.5 py-3 text-xs leading-relaxed text-teal-900">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <p>
          {t('claims.falseClaimWarning')}
        </p>
      </div>

      <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate(-1)}
          disabled={createMutation.isPending}
        >
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : null}
          {t('claims.submitClaim')}
        </Button>
      </div>
    </form>
  );
}
