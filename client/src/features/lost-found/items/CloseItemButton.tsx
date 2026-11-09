import { ArchiveX } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/AuthContext';
import { itemsApi } from '@/features/lost-found/items/itemsApi';
import { ApiError } from '@/lib/api';
import type { LostFoundItem } from '@/types/lostFound';

interface CloseItemButtonProps {
  item: LostFoundItem;
}

export function CloseItemButton({ item }: CloseItemButtonProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const isReporter = item.reporter?.id === user?.id;
  const isOfficer = user?.role === 'LOST_FOUND_OFFICER';
  const isFinalStatus = item.status === 'RETURNED' || item.status === 'CLOSED';
  const reporterCanClose =
    isReporter && item.reportType === 'LOST' && item.status === 'OPEN';
  const canClose = !isFinalStatus && (isOfficer || reporterCanClose);

  const closeMutation = useMutation({
    mutationFn: () => itemsApi.close(item.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['lost-found-item', item.id] });
      await queryClient.invalidateQueries({ queryKey: ['lost-found-items'] });
      toast.success(t('lostFound.itemClosedSuccess'));
      setOpen(false);
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : t('errors.generic'),
      );
    },
  });

  if (!canClose) return null;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="text-destructive hover:bg-destructive/10"
        onClick={() => setOpen(true)}
      >
        <ArchiveX className="h-4 w-4" aria-hidden="true" />
        {isOfficer ? t('lostFound.closeItem') : t('lostFound.closeReport')}
      </Button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={t('lostFound.closeConfirmTitle')}
        description={
          isOfficer
            ? t('lostFound.closeConfirmOfficer')
            : t('lostFound.closeConfirmReporter')
        }
        confirmLabel={t('lostFound.closeReport')}
        tone="destructive"
        isLoading={closeMutation.isPending}
        onConfirm={async () => {
          await closeMutation.mutateAsync();
        }}
      />
    </>
  );
}
