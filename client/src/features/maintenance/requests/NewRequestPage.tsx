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
import { ApiError } from '@/lib/api';
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
      toast.success(`Request ${result.request.requestNumber} submitted`);
      navigate(`/maintenance/requests/${result.request.id}`);
    } catch (error) {
      setServerError(
        error instanceof ApiError
          ? error.message
          : 'Unable to submit this request right now. Please try again.',
      );
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Maintenance"
        title="Report an issue"
        description="Tell us what is wrong and where. A maintenance manager will review the request and, if approved, create a work order."
        actions={
          <Button asChild variant="outline">
            <Link to="/maintenance/requests">Cancel</Link>
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Issue details</CardTitle>
            <p className="text-sm text-muted-foreground">
              Clear details help the maintenance team triage and resolve the issue faster.
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
                label="Title"
                error={errors.title?.message}
                hint="A short summary, for example: Air conditioner leaking in Lab 204."
                required
              >
                <Input
                  id="request-title"
                  placeholder="Air conditioner leaking in Lab 204"
                  maxLength={160}
                  aria-invalid={Boolean(errors.title)}
                  {...register('title')}
                />
              </FormField>

              <FormField
                id="request-description"
                label="Description"
                error={errors.description?.message}
                hint={`${description.length}/4000 characters. Include when the issue started and anything you already tried.`}
                required
              >
                <Textarea
                  id="request-description"
                  placeholder="The unit has been dripping since this morning. Water is pooling near the power outlet…"
                  rows={6}
                  maxLength={4000}
                  aria-invalid={Boolean(errors.description)}
                  {...register('description')}
                />
              </FormField>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  id="request-category"
                  label="Category"
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
                        {category}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField
                  id="request-priority"
                  label="Priority"
                  error={errors.priority?.message}
                  hint="Use Critical only when there is immediate danger or major disruption."
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
                        {priority.charAt(0) + priority.slice(1).toLowerCase()}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>

              <FormField
                id="request-location"
                label="Location"
                error={errors.locationId?.message}
                hint={
                  locationsQuery.isError
                    ? 'Locations could not be loaded. Use the retry button below.'
                    : 'Only active campus locations are available.'
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
                      ? 'Loading locations…'
                      : categoriesAvailable
                        ? 'Select a building, floor and room'
                        : 'No active locations available'}
                  </option>
                  {(locationsQuery.data?.data ?? []).map((location) => (
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

              {!locationsQuery.isLoading && !locationsQuery.isError && !categoriesAvailable ? (
                <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs leading-relaxed text-amber-900">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <p>
                    No active locations are configured. Ask an administrator to add a campus
                    location before submitting a request.
                  </p>
                </div>
              ) : null}

              <FormField
                id="request-equipment"
                label="Equipment involved"
                error={errors.equipmentDescription?.message}
                hint="Optional. Brand, model or asset label, if relevant."
              >
                <Input
                  id="request-equipment"
                  placeholder="Split unit, model MSZ-GE35"
                  maxLength={1000}
                  aria-invalid={Boolean(errors.equipmentDescription)}
                  {...register('equipmentDescription')}
                />
              </FormField>

              <fieldset>
                <legend className="mb-2 text-sm font-medium text-foreground">
                  Photos <span className="font-normal text-muted-foreground">(optional)</span>
                </legend>
                <ImageUpload files={images} onChange={setImages} maxFiles={3} />
              </fieldset>

              <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
                <Button asChild variant="outline">
                  <Link to="/maintenance/requests">Cancel</Link>
                </Button>
                <Button type="submit" disabled={isSubmitting || !categoriesAvailable}>
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : null}
                  Submit request
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
              <CardTitle>What happens next</CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <ol className="space-y-4">
                <li className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">Manager review</p>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      The maintenance manager checks the request, may ask for details, then approves
                      or rejects it with a reason.
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Wrench className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">Work order & technician</p>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Approval creates one work order. A technician is assigned and the repair is
                      tracked through completion.
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <BellRing className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">Stay informed</p>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Notifications keep you updated. You can confirm the fix or reopen the request
                      if the issue returns.
                    </p>
                  </div>
                </li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <CardTitle>Good to include</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-5">
              <div className="flex items-start gap-2.5 text-xs leading-relaxed text-muted-foreground">
                <Camera className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <p>Up to three photos of the issue, taken in good light.</p>
              </div>
              <div className="flex items-start gap-2.5 text-xs leading-relaxed text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <p>The exact building, floor and room so the technician can find it.</p>
              </div>
              <div className="flex items-start gap-2.5 text-xs leading-relaxed text-muted-foreground">
                <ClipboardCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <p>Whether the issue is blocking classes, labs or shared facilities.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
