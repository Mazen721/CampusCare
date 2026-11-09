import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertCircle,
  ArrowRight,
  BellRing,
  Camera,
  ClipboardCheck,
  Loader2,
  MapPin,
  Wrench,
} from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { z } from 'zod';
import { FormField } from '@/components/shared/FormField';
import { ImageUpload } from '@/components/shared/ImageUpload';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { locationsApi } from '@/features/locations/locationsApi';
import { requestsApi } from '@/features/maintenance/requests/requestsApi';
import { useTranslation } from 'react-i18next';
import { enumLabel } from '@/lib/labels';
import { formatLocation } from '@/i18n/localize';
import { getErrorMessage } from '@/lib/api';
import { useMeta } from '@/lib/useMeta';
import {
  MAINTENANCE_CATEGORIES,
  PRIORITIES,
  type MaintenanceCategory,
  type Priority,
} from '@/types/meta';

const requestSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(160, 'Title must be 160 characters or fewer'),
  description: z
    .string()
    .trim()
    .min(10, 'Describe the issue in at least 10 characters')
    .max(4000, 'Description must be 4000 characters or fewer'),
  category: z.enum(MAINTENANCE_CATEGORIES),
  priority: z.enum(PRIORITIES),
  locationId: z.string().min(1, 'Select a campus location'),
  equipmentDescription: z
    .string()
    .trim()
    .max(1000, 'Equipment description must be 1000 characters or fewer')
    .optional(),
});

type RequestValues = z.infer<typeof requestSchema>;

export function NewRequestPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [images, setImages] = useState<File[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const metaQuery = useMeta();
  const categories = metaQuery.data?.maintenanceCategories ?? MAINTENANCE_CATEGORIES;
  const priorities = metaQuery.data?.priorities ?? PRIORITIES;

  const locationsQuery = useQuery({
    queryKey: ['locations', 'request-form'],
    queryFn: () => locationsApi.list({ limit: 100 }),
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RequestValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'General Maintenance' as MaintenanceCategory,
      priority: 'MEDIUM' as Priority,
      locationId: '',
      equipmentDescription: '',
    },
  });

  const description = watch('description') ?? '';
  const categoriesAvailable = (locationsQuery.data?.data.length ?? 0) > 0;

  const onSubmit = async (values: RequestValues) => {
    setServerError(null);
    try {
      const result = await requestsApi.create({
        ...values,
        equipmentDescription: values.equipmentDescription || undefined,
        images,
      });
      toast.success(t('requests.requestCreatedSuccess'));
      navigate(`/maintenance/requests/${result.request.id}`);
    } catch (error) {
      setServerError(getErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('nav.maintenance')}
        title={t('requests.newRequest')}
        description={t('requests.newRequestSubtitle')}
        actions={
          <Button asChild variant="outline">
            <Link to="/maintenance/requests">{t('common.cancel')}</Link>
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>{t('requests.issueDetails')}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {t('requests.issueDetailsHint')}
            </p>
          </CardHeader>
          <CardContent className="pt-6">
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

              <FormField
                id="request-title"
                label={t('requests.itemTitle')}
                error={errors.title?.message}
                hint={t('requests.titleHint')}
                required
              >
                <Input
                  id="request-title"
                  placeholder={t('requests.titlePlaceholder')}
                  maxLength={160}
                  aria-invalid={Boolean(errors.title)}
                  {...register('title')}
                />
              </FormField>

              <FormField
                id="request-description"
                label={t('requests.description')}
                error={errors.description?.message}
                hint={t('requests.descHint', { count: description.length })}
                required
              >
                <Textarea
                  id="request-description"
                  placeholder={t('requests.descPlaceholder')}
                  rows={6}
                  maxLength={4000}
                  aria-invalid={Boolean(errors.description)}
                  {...register('description')}
                />
              </FormField>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  id="request-category"
                  label={t('requests.category')}
                  error={errors.category?.message}
                  required
                >
                  <select
                    id="request-category"
                    className="flex h-10 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    aria-invalid={Boolean(errors.category)}
                    {...register('category')}
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {enumLabel('maintenanceCategory', category)}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField
                  id="request-priority"
                  label={t('requests.priority')}
                  error={errors.priority?.message}
                  required
                >
                  <select
                    id="request-priority"
                    className="flex h-10 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    aria-invalid={Boolean(errors.priority)}
                    {...register('priority')}
                  >
                    {priorities.map((priority) => (
                      <option key={priority} value={priority}>
                        {enumLabel('priority', priority)}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>

              <FormField
                id="request-location"
                label={t('requests.location')}
                error={errors.locationId?.message}
                hint={
                  locationsQuery.isError
                    ? t('requests.locationsLoadError')
                    : undefined
                }
                required
              >
                <select
                  id="request-location"
                  className="flex h-10 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-60"
                  aria-invalid={Boolean(errors.locationId)}
                  disabled={locationsQuery.isLoading || !categoriesAvailable}
                  {...register('locationId')}
                >
                  <option value="">
                    {locationsQuery.isLoading
                      ? t('common.loading')
                      : categoriesAvailable
                        ? t('requests.selectLocation')
                        : t('requests.noLocationsConfigured')}
                  </option>
                  {(locationsQuery.data?.data ?? []).map((location) => (
                    <option key={location.id} value={location.id}>
                      {formatLocation(location)}
                    </option>
                  ))}
                </select>
              </FormField>

              {locationsQuery.isError ? (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-3.5 py-3">
                  <p className="text-xs leading-relaxed text-destructive">
                    {t('requests.locationsLoadError')}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void locationsQuery.refetch()}
                  >
                    {t('errors.retry')}
                  </Button>
                </div>
              ) : null}

              {!locationsQuery.isLoading && !locationsQuery.isError && !categoriesAvailable ? (
                <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs leading-relaxed text-amber-900">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <p>
                    {t('requests.noLocationsConfigured')}
                  </p>
                </div>
              ) : null}

              <FormField
                id="request-equipment"
                label={t('requests.equipmentDescription')}
                error={errors.equipmentDescription?.message}
              >
                <Input
                  id="request-equipment"
                  placeholder={t('requests.equipmentPlaceholder')}
                  maxLength={1000}
                  aria-invalid={Boolean(errors.equipmentDescription)}
                  {...register('equipmentDescription')}
                />
              </FormField>

              <fieldset>
                <legend className="mb-2 text-sm font-medium text-foreground">
                  {t('requests.photos')} <span className="font-normal text-muted-foreground">{t('common.optional')}</span>
                </legend>
                <ImageUpload files={images} onChange={setImages} maxFiles={3} />
              </fieldset>

              <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
                <Button asChild variant="outline">
                  <Link to="/maintenance/requests">{t('common.cancel')}</Link>
                </Button>
                <Button type="submit" disabled={isSubmitting || !categoriesAvailable}>
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : null}
                  {t('requests.submitRequest')}
                  {!isSubmitting ? (
                    <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                  ) : null}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>{t('requests.whatHappensNext')}</CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <ol className="space-y-4">
                <li className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{t('requests.managerReview')}</p>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {t('requests.managerReviewDesc')}
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Wrench className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{t('requests.workOrderTechnician')}</p>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {t('requests.workOrderTechnicianDesc')}
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <BellRing className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{t('requests.stayInformed')}</p>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {t('requests.stayInformedDesc')}
                    </p>
                  </div>
                </li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <CardTitle>{t('requests.goodToInclude')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-5">
              <div className="flex items-start gap-2.5 text-xs leading-relaxed text-muted-foreground">
                <Camera className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <p>{t('requests.tipPhotos')}</p>
              </div>
              <div className="flex items-start gap-2.5 text-xs leading-relaxed text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <p>{t('requests.tipLocation')}</p>
              </div>
              <div className="flex items-start gap-2.5 text-xs leading-relaxed text-muted-foreground">
                <ClipboardCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <p>{t('requests.tipImpact')}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
