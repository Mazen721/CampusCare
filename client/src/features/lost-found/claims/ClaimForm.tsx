import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { FormField } from '@/components/shared/FormField';
import { ImageUpload } from '@/components/shared/ImageUpload';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  claimFormSchema,
  type ClaimFormValues,
} from '@/features/lost-found/claims/claimFormSchema';
import { claimsApi } from '@/features/lost-found/claims/claimsApi';
import { ApiError } from '@/lib/api';
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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [images, setImages] = useState<File[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClaimFormValues>({
    resolver: zodResolver(claimFormSchema),
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
      toast.success(`Claim ${claim.claimNumber} submitted for officer review.`);
      navigate(`/lost-found/claims/${claim.id}`);
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : 'Unable to submit your claim.',
      );
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
            {foundItem.reportNumber}
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">{foundItem.itemTitle}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {foundItem.category} · Found {formatDate(foundItem.occurrenceDate)}
            {foundItem.location ? ` · ${foundItem.location.buildingName}` : ''}
          </p>
          <input type="hidden" {...register('itemId')} />
        </div>
      ) : (
        <FormField
          id="claim-item"
          label="Found item"
          error={errors.itemId?.message}
          hint="Choose the found report that belongs to you."
          required
        >
          <select
            id="claim-item"
            className={selectClass}
            aria-invalid={Boolean(errors.itemId)}
            {...register('itemId')}
          >
            <option value="">Select a found item</option>
            {claimableItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.reportNumber} · {item.itemTitle}
              </option>
            ))}
          </select>
        </FormField>
      )}

      <FormField
        id="claim-description"
        label="Why is this your item?"
        error={errors.claimDescription?.message}
        hint="Tell the officer how the item was lost and what you remember about it."
        required
      >
        <Textarea
          id="claim-description"
          rows={4}
          maxLength={4000}
          placeholder="I left my backpack in Lab 204 after the afternoon lecture…"
          aria-invalid={Boolean(errors.claimDescription)}
          {...register('claimDescription')}
        />
      </FormField>

      <div className="rounded-lg border border-amber-300/70 bg-amber-50 px-3.5 py-3">
        <FormField
          id="claim-identifying-details"
          label="Private identifying details"
          error={errors.identifyingDetailsProvided?.message}
          hint="Serial numbers, engravings, contents or hidden marks. Officers compare these with the private details on the found report; they are never shown publicly."
          required
        >
          <Textarea
            id="claim-identifying-details"
            rows={3}
            maxLength={4000}
            placeholder="There is a blue keychain inside the front pocket and my initials are written under the flap."
            aria-invalid={Boolean(errors.identifyingDetailsProvided)}
            {...register('identifyingDetailsProvided')}
          />
        </FormField>
      </div>

      <FormField
        id="claim-linked-lost"
        label="Linked lost report"
        error={errors.linkedLostItemId?.message}
        hint="Optional. Linking your lost report lets the officer update it when the item is returned."
      >
        <select id="claim-linked-lost" className={selectClass} {...register('linkedLostItemId')}>
          <option value="">No linked lost report</option>
          {lostReports.map((item) => (
            <option key={item.id} value={item.id}>
              {item.reportNumber} · {item.itemTitle}
            </option>
          ))}
        </select>
      </FormField>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-foreground">
          Supporting photos{' '}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </legend>
        <ImageUpload files={images} onChange={setImages} maxFiles={3} />
      </fieldset>

      <div className="flex items-start gap-2.5 rounded-lg border border-teal-200 bg-teal-50/60 px-3.5 py-3 text-xs leading-relaxed text-teal-900">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <p>
          A false claim is a conduct matter. Only submit a claim if you can prove the item is
          yours.
        </p>
      </div>

      <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate(-1)}
          disabled={createMutation.isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : null}
          Submit claim
        </Button>
      </div>
    </form>
  );
}
