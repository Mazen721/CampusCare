import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { AlertCircle, Loader2, MapPin, PackageOpen, Search } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { FormField } from '@/components/shared/FormField';
import { ImageUpload } from '@/components/shared/ImageUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { locationsApi } from '@/features/locations/locationsApi';
import { itemsApi } from '@/features/lost-found/items/itemsApi';
import {
  reportItemSchema,
  type ReportItemValues,
} from '@/features/lost-found/items/reportItemSchema';
import { ApiError } from '@/lib/api';
import {
  LOST_FOUND_CATEGORIES,
  type LostFoundCategory,
  type ReportType,
} from '@/types/lostFound';

const selectClass =
  'flex h-10 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-60';

interface ReportItemFormProps {
  onCancel?: () => void;
}

export function ReportItemForm({ onCancel }: ReportItemFormProps) {
  const navigate = useNavigate();
  const [images, setImages] = useState<File[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);

  const locationsQuery = useQuery({
    queryKey: ['locations', 'lost-found-report'],
    queryFn: () => locationsApi.list({ limit: 100 }),
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ReportItemValues>({
    resolver: zodResolver(reportItemSchema),
    defaultValues: {
      reportType: 'LOST',
      itemTitle: '',
      description: '',
      privateIdentificationDetails: '',
      category: 'Other' as LostFoundCategory,
      color: '',
      brand: '',
      locationId: '',
      locationDetails: '',
      occurrenceDate: format(new Date(), 'yyyy-MM-dd'),
    },
  });

  const reportType = watch('reportType');
  const dateLabel = reportType === 'LOST' ? 'When did you lose it?' : 'When did you find it?';
  const locations = locationsQuery.data?.data ?? [];
  const noLocations = !locationsQuery.isLoading && !locationsQuery.isError && locations.length === 0;

  const onSubmit = async (values: ReportItemValues) => {
    setServerError(null);
    try {
      const result = await itemsApi.create({
        ...values,
        color: values.color || undefined,
        brand: values.brand || undefined,
        images,
      });
      toast.success(`Report ${result.item.reportNumber} submitted`);
      navigate(`/lost-found/items/${result.item.id}`);
    } catch (error) {
      setServerError(
        error instanceof ApiError
          ? error.message
          : 'Unable to submit this report right now. Please try again.',
      );
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
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
        <legend className="mb-2 text-sm font-medium text-foreground">Report type</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {(
            [
              {
                value: 'LOST' as ReportType,
                title: 'I lost something',
                description: 'Create a lost report so others can help identify it.',
                icon: Search,
              },
              {
                value: 'FOUND' as ReportType,
                title: 'I found something',
                description: 'Log a found item for the Lost & Found Office to hold.',
                icon: PackageOpen,
              },
            ] as const
          ).map((option) => {
            const Icon = option.icon;
            const selected = reportType === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setValue('reportType', option.value, { shouldValidate: true })}
                aria-pressed={selected}
                className={
                  selected
                    ? 'flex items-start gap-3 rounded-lg border border-primary/50 bg-primary/5 p-3 text-start ring-1 ring-primary/20'
                    : 'flex items-start gap-3 rounded-lg border bg-card p-3 text-start transition-colors hover:bg-muted/40'
                }
              >
                <span
                  className={
                    selected
                      ? 'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary'
                      : 'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground'
                  }
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-foreground">
                    {option.title}
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                    {option.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <FormField
        id="item-title"
        label="Item title"
        error={errors.itemTitle?.message}
        hint="Keep it recognisable but do not include serial numbers or other private identifiers."
        required
      >
        <Input
          id="item-title"
          placeholder="Black North Face backpack with a blue keychain"
          maxLength={160}
          aria-invalid={Boolean(errors.itemTitle)}
          {...register('itemTitle')}
        />
      </FormField>

      <FormField
        id="item-description"
        label="Public description"
        error={errors.description?.message}
        hint="This is visible to every signed-in user. Describe the item without private details."
        required
      >
        <Textarea
          id="item-description"
          placeholder="What does it look like, and where was it last seen?"
          rows={4}
          maxLength={4000}
          aria-invalid={Boolean(errors.description)}
          {...register('description')}
        />
      </FormField>

      <div className="rounded-lg border border-amber-300/70 bg-amber-50 px-3.5 py-3">
        <FormField
          id="item-private-details"
          label="Private identification details"
          error={errors.privateIdentificationDetails?.message}
          hint="Only you, Lost & Found Officers and the Admin can see this. Add serial numbers, engravings, contents or anything needed to prove ownership."
          required
        >
          <Textarea
            id="item-private-details"
            placeholder="Serial number, an engraving, a hidden mark, or a distinctive item inside the bag…"
            rows={3}
            maxLength={4000}
            aria-invalid={Boolean(errors.privateIdentificationDetails)}
            {...register('privateIdentificationDetails')}
          />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="item-category" label="Category" error={errors.category?.message} required>
          <select
            id="item-category"
            className={selectClass}
            aria-invalid={Boolean(errors.category)}
            {...register('category')}
          >
            {LOST_FOUND_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </FormField>

        <FormField id="item-date" label={dateLabel} error={errors.occurrenceDate?.message} required>
          <Input
            id="item-date"
            type="date"
            aria-invalid={Boolean(errors.occurrenceDate)}
            {...register('occurrenceDate')}
          />
        </FormField>

        <FormField id="item-color" label="Colour" error={errors.color?.message} hint="Optional.">
          <Input
            id="item-color"
            placeholder="Black"
            maxLength={60}
            aria-invalid={Boolean(errors.color)}
            {...register('color')}
          />
        </FormField>

        <FormField id="item-brand" label="Brand" error={errors.brand?.message} hint="Optional.">
          <Input
            id="item-brand"
            placeholder="North Face"
            maxLength={80}
            aria-invalid={Boolean(errors.brand)}
            {...register('brand')}
          />
        </FormField>
      </div>

      <FormField
        id="item-location"
        label="Campus location"
        error={errors.locationId?.message}
        hint={
          locationsQuery.isError
            ? 'Locations could not be loaded. Use the retry button below.'
            : 'Choose the building, floor and room closest to where it was lost or found.'
        }
        required
      >
        <select
          id="item-location"
          className={selectClass}
          aria-invalid={Boolean(errors.locationId)}
          disabled={locationsQuery.isLoading || noLocations}
          {...register('locationId')}
        >
          <option value="">
            {locationsQuery.isLoading ? 'Loading locations…' : 'Select a campus location'}
          </option>
          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.buildingName} · {location.floor} · Room {location.room}
            </option>
          ))}
        </select>
      </FormField>

      {locationsQuery.isError ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-3.5 py-3">
          <p className="text-xs leading-relaxed text-destructive">
            Unable to load locations. Check your connection and try again.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void locationsQuery.refetch()}
          >
            Retry
          </Button>
        </div>
      ) : null}

      {noLocations ? (
        <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs leading-relaxed text-amber-900">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>No active locations are configured yet. Ask an administrator to add one first.</p>
        </div>
      ) : null}

      <FormField
        id="item-location-details"
        label="Location details"
        error={errors.locationDetails?.message}
        hint="For example: bench outside Lab 204, second-floor library desk."
        required
      >
        <Input
          id="item-location-details"
          placeholder="Bench outside Lab 204"
          maxLength={500}
          aria-invalid={Boolean(errors.locationDetails)}
          {...register('locationDetails')}
        />
      </FormField>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-foreground">
          Photos <span className="font-normal text-muted-foreground">(optional)</span>
        </legend>
        <ImageUpload files={images} onChange={setImages} maxFiles={3} />
      </fieldset>

      <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" disabled={isSubmitting || noLocations || locationsQuery.isLoading}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          Submit report
        </Button>
      </div>
    </form>
  );
}
