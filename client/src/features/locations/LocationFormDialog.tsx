import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { z } from 'zod';
import type { TFunction } from 'i18next';
import { FormField } from '@/components/shared/FormField';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { locationsApi } from '@/features/locations/locationsApi';
import { ApiError } from '@/lib/api';
import { enumLabel } from '@/lib/labels';
import { LOCATION_TYPES } from '@/types/meta';
import type { LocationRecord } from '@/types/locations';

export function createLocationSchema(t: TFunction) {
  return z.object({
    buildingName: z
      .string()
      .trim()
      .min(1, t('validation.fieldRequired', { field: t('locations.buildingName') }))
      .max(120, t('validation.maxChars', { field: t('locations.buildingName'), max: 120 })),
    floor: z
      .string()
      .trim()
      .min(1, t('validation.fieldRequired', { field: t('locations.floor') }))
      .max(40, t('validation.maxChars', { field: t('locations.floor'), max: 40 })),
    room: z
      .string()
      .trim()
      .min(1, t('validation.fieldRequired', { field: t('locations.room') }))
      .max(40, t('validation.maxChars', { field: t('locations.room'), max: 40 })),
    locationType: z.enum(LOCATION_TYPES),
    description: z
      .string()
      .trim()
      .max(500, t('validation.maxChars', { field: t('locations.description'), max: 500 }))
      .optional(),
  });
}

export type LocationSchema = ReturnType<typeof createLocationSchema>;
export type LocationValues = z.infer<LocationSchema>;

const EMPTY_VALUES: LocationValues = {
  buildingName: '',
  floor: '',
  room: '',
  locationType: 'ROOM',
  description: '',
};

interface LocationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location?: LocationRecord | null;
}

export function LocationFormDialog({ open, onOpenChange, location }: LocationFormDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const isEditing = Boolean(location);

  const schema = useMemo(() => createLocationSchema(t), [t]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LocationValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY_VALUES,
  });

  useEffect(() => {
    if (!open) return;
    setServerError(null);
    reset(
      location
        ? {
            buildingName: location.buildingName,
            floor: location.floor,
            room: location.room,
            locationType: location.locationType,
            description: location.description ?? '',
          }
        : EMPTY_VALUES,
    );
  }, [open, location, reset]);

  const saveLocation = useMutation({
    mutationFn: (values: LocationValues) => {
      const payload = {
        ...values,
        description: values.description || undefined,
      };
      return location
        ? locationsApi.update(location.id, payload)
        : locationsApi.create(payload);
    },
  });

  const onSubmit = async (values: LocationValues) => {
    setServerError(null);
    try {
      await saveLocation.mutateAsync(values);
      await queryClient.invalidateQueries({ queryKey: ['locations'] });
      toast.success(t('locations.locationSavedSuccess'));
      onOpenChange(false);
    } catch (error) {
      setServerError(
        error instanceof ApiError ? error.message : t('errors.generic'),
      );
    }
  };

  const descriptionValue = watch('description') ?? '';

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !isSubmitting && onOpenChange(nextOpen)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? t('locations.editLocation') : t('locations.createLocation')}</DialogTitle>
          <DialogDescription>
            {t('locations.subtitle')}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          {serverError ? (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg border border-destructive/25 bg-destructive/5 px-3.5 py-3 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{serverError}</span>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="location-building" label={t('locations.buildingName')} error={errors.buildingName?.message} required>
              <Input
                id="location-building"
                placeholder={t('locations.buildingNamePlaceholder')}
                aria-invalid={Boolean(errors.buildingName)}
                {...register('buildingName')}
              />
            </FormField>

            <FormField id="location-type" label={t('locations.locationType')} error={errors.locationType?.message} required>
              <select
                id="location-type"
                className="flex h-10 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-invalid={Boolean(errors.locationType)}
                {...register('locationType')}
              >
                {LOCATION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {enumLabel('locationType', type)}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField id="location-floor" label={t('locations.floor')} error={errors.floor?.message} required>
              <Input
                id="location-floor"
                placeholder={t('locations.floorPlaceholder')}
                aria-invalid={Boolean(errors.floor)}
                {...register('floor')}
              />
            </FormField>

            <FormField id="location-room" label={t('locations.room')} error={errors.room?.message} required>
              <Input
                id="location-room"
                placeholder={t('locations.roomPlaceholder')}
                aria-invalid={Boolean(errors.room)}
                {...register('room')}
              />
            </FormField>
          </div>

          <FormField
            id="location-description"
            label={t('locations.description')}
            error={errors.description?.message}
            hint={`${descriptionValue.length}/500`}
          >
            <Textarea
              id="location-description"
              placeholder={t('locations.descPlaceholder')}
              maxLength={500}
              aria-invalid={Boolean(errors.description)}
              {...register('description')}
            />
          </FormField>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : null}
              {t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
