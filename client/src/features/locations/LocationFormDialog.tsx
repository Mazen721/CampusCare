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
import { getErrorMessage } from '@/lib/api';
import { enumLabel } from '@/lib/labels';
import { LOCATION_TYPES } from '@/types/meta';
import type { LocationRecord } from '@/types/locations';

export function createLocationSchema(t: TFunction) {
  return z.object({
    buildingName: z
      .string()
      .trim()
      .min(1, t('validation.fieldRequired', { field: t('locations.buildingNameEn') }))
      .max(120, t('validation.maxChars', { field: t('locations.buildingNameEn'), max: 120 })),
    buildingNameAr: z
      .string()
      .trim()
      .min(1, t('validation.fieldRequired', { field: t('locations.buildingNameAr') }))
      .max(120, t('validation.maxChars', { field: t('locations.buildingNameAr'), max: 120 })),
    floor: z
      .string()
      .trim()
      .min(1, t('validation.fieldRequired', { field: t('locations.floorEn') }))
      .max(40, t('validation.maxChars', { field: t('locations.floorEn'), max: 40 })),
    floorAr: z
      .string()
      .trim()
      .max(40, t('validation.maxChars', { field: t('locations.floorAr'), max: 40 }))
      .optional(),
    room: z
      .string()
      .trim()
      .min(1, t('validation.fieldRequired', { field: t('locations.roomEn') }))
      .max(40, t('validation.maxChars', { field: t('locations.roomEn'), max: 40 })),
    roomAr: z
      .string()
      .trim()
      .max(40, t('validation.maxChars', { field: t('locations.roomAr'), max: 40 }))
      .optional(),
    locationType: z.enum(LOCATION_TYPES),
    description: z
      .string()
      .trim()
      .max(500, t('validation.maxChars', { field: t('locations.descriptionEn'), max: 500 }))
      .optional(),
    descriptionAr: z
      .string()
      .trim()
      .max(500, t('validation.maxChars', { field: t('locations.descriptionAr'), max: 500 }))
      .optional(),
  });
}

export type LocationSchema = ReturnType<typeof createLocationSchema>;
export type LocationValues = z.infer<LocationSchema>;

const EMPTY_VALUES: LocationValues = {
  buildingName: '',
  buildingNameAr: '',
  floor: '',
  floorAr: '',
  room: '',
  roomAr: '',
  locationType: 'ROOM',
  description: '',
  descriptionAr: '',
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
            buildingNameAr: location.buildingNameAr ?? '',
            floor: location.floor,
            floorAr: location.floorAr ?? '',
            room: location.room,
            roomAr: location.roomAr ?? '',
            locationType: location.locationType,
            description: location.description ?? '',
            descriptionAr: location.descriptionAr ?? '',
          }
        : EMPTY_VALUES,
    );
  }, [open, location, reset]);

  const saveLocation = useMutation({
    mutationFn: (values: LocationValues) => {
      const payload = {
        ...values,
        floorAr: values.floorAr || undefined,
        roomAr: values.roomAr || undefined,
        description: values.description || undefined,
        descriptionAr: values.descriptionAr || undefined,
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
      setServerError(getErrorMessage(error));
    }
  };

  const descriptionValue = watch('description') ?? '';
  const descriptionArValue = watch('descriptionAr') ?? '';

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !isSubmitting && onOpenChange(nextOpen)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
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
            <FormField id="location-building-en" label={t('locations.buildingNameEn')} error={errors.buildingName?.message} required>
              <Input
                id="location-building-en"
                dir="ltr"
                placeholder={t('locations.buildingNamePlaceholder')}
                aria-invalid={Boolean(errors.buildingName)}
                {...register('buildingName')}
              />
            </FormField>

            <FormField id="location-building-ar" label={t('locations.buildingNameAr')} error={errors.buildingNameAr?.message} required>
              <Input
                id="location-building-ar"
                dir="rtl"
                placeholder="مثال: مبنى كلية الهندسة"
                aria-invalid={Boolean(errors.buildingNameAr)}
                {...register('buildingNameAr')}
              />
            </FormField>

            <FormField id="location-floor-en" label={t('locations.floorEn')} error={errors.floor?.message} required>
              <Input
                id="location-floor-en"
                dir="ltr"
                placeholder={t('locations.floorPlaceholder')}
                aria-invalid={Boolean(errors.floor)}
                {...register('floor')}
              />
            </FormField>

            <FormField id="location-floor-ar" label={t('locations.floorAr')} error={errors.floorAr?.message}>
              <Input
                id="location-floor-ar"
                dir="rtl"
                placeholder="مثال: الطابق الأرضي، الطابق الثاني"
                aria-invalid={Boolean(errors.floorAr)}
                {...register('floorAr')}
              />
            </FormField>

            <FormField id="location-room-en" label={t('locations.roomEn')} error={errors.room?.message} required>
              <Input
                id="location-room-en"
                dir="ltr"
                placeholder={t('locations.roomPlaceholder')}
                aria-invalid={Boolean(errors.room)}
                {...register('room')}
              />
            </FormField>

            <FormField id="location-room-ar" label={t('locations.roomAr')} error={errors.roomAr?.message}>
              <Input
                id="location-room-ar"
                dir="rtl"
                placeholder="مثال: مدرج A، معمل 102"
                aria-invalid={Boolean(errors.roomAr)}
                {...register('roomAr')}
              />
            </FormField>
          </div>

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

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="location-description-en"
              label={t('locations.descriptionEn')}
              error={errors.description?.message}
              hint={`${descriptionValue.length}/500`}
            >
              <Textarea
                id="location-description-en"
                dir="ltr"
                placeholder={t('locations.descPlaceholder')}
                maxLength={500}
                aria-invalid={Boolean(errors.description)}
                {...register('description')}
              />
            </FormField>

            <FormField
              id="location-description-ar"
              label={t('locations.descriptionAr')}
              error={errors.descriptionAr?.message}
              hint={`${descriptionArValue.length}/500`}
            >
              <Textarea
                id="location-description-ar"
                dir="rtl"
                placeholder="إرشادات أو علامات مميزة للوصول للمكان..."
                maxLength={500}
                aria-invalid={Boolean(errors.descriptionAr)}
                {...register('descriptionAr')}
              />
            </FormField>
          </div>

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
