import { Handshake, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
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
import { claimsApi } from '@/features/lost-found/claims/claimsApi';
import { ApiError } from '@/lib/api';
import type { ClaimRecord } from '@/types/claims';

interface HandoverDialogProps {
  claim: ClaimRecord;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HandoverDialog({ claim, open, onOpenChange }: HandoverDialogProps) {
  const queryClient = useQueryClient();
  const [receivedByName, setReceivedByName] = useState('');
  const [notes, setNotes] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setReceivedByName(claim.claimant?.name ?? '');
      setNotes('');
      setNameError(null);
    }
  }, [open, claim.claimant?.name]);

  const handoverMutation = useMutation({
    mutationFn: () =>
      claimsApi.handover(claim.id, {
        receivedByName: receivedByName.trim(),
        notes: notes.trim() || undefined,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['lost-found-claims'] });
      void queryClient.invalidateQueries({ queryKey: ['lost-found-claim', claim.id] });
      void queryClient.invalidateQueries({ queryKey: ['lost-found-item', claim.item?.id] });
      toast.success(`Handover recorded for ${claim.claimNumber}.`);
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : 'Unable to record the handover.',
      );
    },
  });

  function submit(): void {
    if (receivedByName.trim().length < 2) {
      setNameError('Enter who received the item');
      return;
    }
    setNameError(null);
    handoverMutation.mutate();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => !handoverMutation.isPending && onOpenChange(nextOpen)}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Handshake className="h-4 w-4 text-primary" aria-hidden="true" />
            Record handover
          </DialogTitle>
          <DialogDescription>
            Confirming the handover completes the claim and marks the found item and linked lost
            report as returned.
          </DialogDescription>
        </DialogHeader>

        <FormField
          id="handover-received-by"
          label="Received by"
          error={nameError ?? undefined}
          hint="The person who physically collected the item."
          required
        >
          <Input
            id="handover-received-by"
            value={receivedByName}
            maxLength={120}
            onChange={(event) => setReceivedByName(event.target.value)}
            placeholder="Full name"
            aria-invalid={Boolean(nameError)}
          />
        </FormField>

        <FormField
          id="handover-notes"
          label="Handover notes"
          hint="Optional. Add an ID reference or anything the office should keep on record."
        >
          <Textarea
            id="handover-notes"
            rows={3}
            maxLength={1000}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Student ID checked and recorded."
          />
        </FormField>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={handoverMutation.isPending}
          >
            Cancel
          </Button>
          <Button type="button" onClick={submit} disabled={handoverMutation.isPending}>
            {handoverMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Handshake className="h-4 w-4" aria-hidden="true" />
            )}
            Confirm handover
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
