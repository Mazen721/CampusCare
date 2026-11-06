import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { z } from 'zod';
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
import { LOCATION_TYPES } from '@/types/meta';
import type { LocationRecord } from '@/types/locations';

const locationSchema = z.object({
  buildingName: z
    .string()
    .trim()
    .min(1, 'Building name is required')
    .max(120, 'Building name must be 120 characters or fewer'),
  floor: z.string().trim().min(1, 'Floor is required').max(40, 'Floor must be 40 characters or fewer'),
  room: z.string().trim().min(1, 'Room is required').max(40, 'Room must be 40 characters or fewer'),
  locationType: z.enum(LOCATION_TYPES),
  description: z
    .string()
    .trim()
    .max(500, 'Description must be 500 characters or fewer')
    .optional(),
});

type LocationValues = z.infer<typeof locationSchema>;

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
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const isEditing = Boolean(location);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LocationValues>({
    resolver: zodResolver(locationSchema),
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
      toast.success(isEditing ? 'Location updated' : 'Location added');
      onOpenChange(false);
    } catch (error) {
      setServerError(
        error instanceof ApiError ? error.message : 'Unable to save this location. Try again.',
      );
    }
  };

  const descriptionValue = watch('description') ?? '';

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !isSubmitting && onOpenChange(nextOpen)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit location' : 'Add location'}</DialogTitle>
          <DialogDescription>
            Locations are shared by maintenance requests and lost & found reports. Building, floor
            and room must be unique together.
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
            <FormField id="location-building" label="Building" error={errors.buildingName?.message} required>
              <Input
                id="location-building"
                placeholder="Main Building"
                aria-invalid={Boolean(errors.buildingName)}
                {...register('buildingName')}
              />
            </FormField>

            <FormField id="location-type" label="Location type" error={errors.locationType?.message} required>
              <select
                id="location-type"
                className="flex h-10 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-invalid={Boolean(errors.locationType)}
                {...register('locationType')}
              >
                {LOCATION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0) + type.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField id="location-floor" label="Floor" error={errors.floor?.message} required>
              <Input
                id="location-floor"
                placeholder="Ground floor"
                aria-invalid={Boolean(errors.floor)}
                {...register('floor')}
              />
            </FormField>

            <FormField id="location-room" label="Room" error={errors.room?.message} required>
              <Input
                id="location-room"
                placeholder="Lab 204"
                aria-invalid={Boolean(errors.room)}
                {...register('room')}
              />
            </FormField>
          </div>

          <FormField
            id="location-description"
            label="Description"
            error={errors.description?.message}
            hint={`${descriptionValue.length}/500 characters. Optional directions or access notes.`}
          >
            <Textarea
              id="location-description"
              placeholder="Near the east stairwell, second door on the right."
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
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : null}
              {isEditing ? 'Save changes' : 'Add location'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
