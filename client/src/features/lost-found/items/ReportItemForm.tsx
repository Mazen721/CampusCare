import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Loader2, MapPin, PackageOpen, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
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
  createReportItemSchema,
  type ReportItemValues,
} from '@/features/lost-found/items/reportItemSchema';
import { getErrorMessage } from '@/lib/api';
import { fmt } from '@/lib/dateLocale';
import { enumLabel } from '@/lib/labels';
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [images, setImages] = useState<File[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);

  const locationsQuery = useQuery({
    queryKey: ['locations', 'lost-found-report'],
    queryFn: () => locationsApi.list({ limit: 100 }),
  });

  const schema = useMemo(() => createReportItemSchema(t), [t]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ReportItemValues>({
    resolver: zodResolver(schema),
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
      occurrenceDate: fmt(new Date(), 'yyyy-MM-dd'),
    },
  });

  const reportType = watch('reportType');
  const dateLabel = reportType === 'LOST' ? t('lostFound.whenLostDate') : t('lostFound.whenFoundDate');
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
      toast.success(t('lostFound.reportSavedSuccess'));
      navigate(`/lost-found/items/${result.item.id}`);
    } catch (error) {
      setServerError(getErrorMessage(error));
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
        <legend className="mb-2 text-sm font-medium text-foreground">{t('lostFound.filterByType')}</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {(
            [
              {
                value: 'LOST' as ReportType,
                title: t('lostFound.iLostSomething'),
                description: t('lostFound.iLostSomethingDesc'),
                icon: Search,
              },
              {
                value: 'FOUND' as ReportType,
                title: t('lostFound.iFoundSomething'),
                description: t('lostFound.iFoundSomethingDesc'),
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
        label={t('lostFound.itemTitle')}
        error={errors.itemTitle?.message}
        hint={t('lostFound.itemTitleHint')}
        required
      >
        <Input
          id="item-title"
          placeholder={t('lostFound.itemTitlePlaceholder')}
          maxLength={160}
          aria-invalid={Boolean(errors.itemTitle)}
          {...register('itemTitle')}
        />
      </FormField>

      <FormField
        id="item-description"
        label={t('lostFound.publicDescription')}
        error={errors.description?.message}
        hint={t('lostFound.descriptionHint')}
        required
      >
        <Textarea
          id="item-description"
          placeholder={t('lostFound.descriptionPlaceholder')}
          rows={4}
          maxLength={4000}
          aria-invalid={Boolean(errors.description)}
          {...register('description')}
        />
      </FormField>

      <div className="rounded-lg border border-amber-300/70 bg-amber-50 px-3.5 py-3">
        <FormField
          id="item-private-details"
          label={t('lostFound.privateDetails')}
          error={errors.privateIdentificationDetails?.message}
          hint={t('lostFound.privateDetailsHintLong')}
          required
        >
          <Textarea
            id="item-private-details"
            placeholder={t('lostFound.privateDetailsPlaceholderLong')}
            rows={3}
            maxLength={4000}
            aria-invalid={Boolean(errors.privateIdentificationDetails)}
            {...register('privateIdentificationDetails')}
          />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="item-category" label={t('common.category')} error={errors.category?.message} required>
          <select
            id="item-category"
            className={selectClass}
            aria-invalid={Boolean(errors.category)}
            {...register('category')}
          >
            {LOST_FOUND_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {enumLabel('lostFoundCategory', category)}
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

        <FormField id="item-color" label={t('lostFound.color')} error={errors.color?.message} hint={t('common.optional')}>
          <Input
            id="item-color"
            placeholder={t('lostFound.colorPlaceholder')}
            maxLength={60}
            aria-invalid={Boolean(errors.color)}
            {...register('color')}
          />
        </FormField>

        <FormField id="item-brand" label={t('lostFound.brand')} error={errors.brand?.message} hint={t('common.optional')}>
          <Input
            id="item-brand"
            placeholder={t('lostFound.brandPlaceholder')}
            maxLength={80}
            aria-invalid={Boolean(errors.brand)}
            {...register('brand')}
          />
        </FormField>
      </div>

      <FormField
        id="item-location"
        label={t('lostFound.campusLocation')}
        error={errors.locationId?.message}
        hint={
          locationsQuery.isError
            ? t('errors.network')
            : t('lostFound.selectLocationHint')
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
            {locationsQuery.isLoading ? t('common.loading') : t('lostFound.selectLocation')}
          </option>
          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.buildingName} · {location.floor} · {t('locations.room')} {location.room}
            </option>
          ))}
        </select>
      </FormField>

      {locationsQuery.isError ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-3.5 py-3">
          <p className="text-xs leading-relaxed text-destructive">
            {t('errors.network')}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void locationsQuery.refetch()}
          >
            {t('common.refresh')}
          </Button>
        </div>
      ) : null}

      {noLocations ? (
        <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs leading-relaxed text-amber-900">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>{t('lostFound.noLocationsWarning')}</p>
        </div>
      ) : null}

      <FormField
        id="item-location-details"
        label={t('lostFound.locationDetails')}
        error={errors.locationDetails?.message}
        hint={t('lostFound.locationDetailsHint')}
        required
      >
        <Input
          id="item-location-details"
          placeholder={t('lostFound.locationDetailsPlaceholder')}
          maxLength={500}
          aria-invalid={Boolean(errors.locationDetails)}
          {...register('locationDetails')}
        />
      </FormField>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-foreground">
          {t('lostFound.images')} <span className="font-normal text-muted-foreground">({t('common.optional')})</span>
        </legend>
        <ImageUpload files={images} onChange={setImages} maxFiles={3} />
      </fieldset>

      <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            {t('common.cancel')}
          </Button>
        ) : null}
        <Button type="submit" disabled={isSubmitting || noLocations || locationsQuery.isLoading}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          {t('lostFound.submitReport')}
        </Button>
      </div>
    </form>
  );
}
