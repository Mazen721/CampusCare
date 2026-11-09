import { CheckCircle2, Loader2, MessageSquare, Star } from 'lucide-react';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/features/auth/AuthContext';
import { feedbackApi } from '@/features/maintenance/feedback/feedbackApi';
import { ApiError } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import type { MaintenanceRequestRecord } from '@/types/maintenance';

interface FeedbackCardProps {
  request: MaintenanceRequestRecord;
  isOwner: boolean;
}

export function FeedbackCard({ request, isOwner }: FeedbackCardProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');

  const isManager = user?.role === 'MAINTENANCE_MANAGER' || user?.role === 'SUPER_ADMIN';
  const canViewFeedback = isOwner || isManager;

  // Check if feedback already exists for this user / request
  const { data: feedbackData, isLoading } = useQuery({
    queryKey: ['feedback', { maintenanceRequestId: request.id }],
    queryFn: () => feedbackApi.list({ maintenanceRequestId: request.id, limit: 1 }),
    enabled: request.status === 'CLOSED' && canViewFeedback,
  });

  const existingFeedback = feedbackData?.data?.[0];

  const submitMutation = useMutation({
    mutationFn: () =>
      feedbackApi.create({
        maintenanceRequestId: request.id,
        rating,
        comment: comment.trim() || undefined,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['feedback'] });
      await queryClient.invalidateQueries({ queryKey: ['request', request.id] });
      toast.success('Thank you! Your feedback has been recorded.');
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : 'Unable to submit feedback',
      );
    },
  });

  if (request.status !== 'CLOSED' || !canViewFeedback) {
    return null;
  }

  if (isLoading) {
    return null;
  }

  // If already submitted, display the feedback
  if (existingFeedback) {
    return (
      <Card className="border-emerald-500/30 bg-emerald-500/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Service Feedback Recorded
            </CardTitle>
            <span className="text-xs text-muted-foreground">
              {formatDate(existingFeedback.createdAt)}
            </span>
          </div>
          <CardDescription>
            Feedback submitted for technician <bdi>{existingFeedback.technician.name}</bdi>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-5 w-5 ${
                  star <= existingFeedback.rating
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-muted-foreground/30'
                }`}
              />
            ))}
            <span className="ms-2 font-semibold text-sm">
              {existingFeedback.rating} / 5
            </span>
          </div>
          {existingFeedback.comment && (
            <p className="rounded-md border bg-background/80 p-3 text-sm text-foreground italic">
              "{existingFeedback.comment}"
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  // If not owner, don't show the submission form
  if (!isOwner) {
    return null;
  }

  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-amber-500" />
          Rate Maintenance Service
        </CardTitle>
        <CardDescription>
          How satisfied were you with the resolution of this issue? Your feedback helps improve service quality.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-xs font-medium text-foreground block mb-2">
            Rating (1 to 5 stars)
          </label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => {
              const active = hoverRating !== null ? star <= hoverRating : star <= rating;
              return (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  className="rounded p-1 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={`${star} star${star > 1 ? 's' : ''}`}
                >
                  <Star
                    className={`h-7 w-7 transition-colors ${
                      active
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-muted-foreground/40 hover:text-amber-300'
                    }`}
                  />
                </button>
              );
            })}
            <span className="ms-2 text-sm font-semibold text-foreground">
              {hoverRating ?? rating} / 5
            </span>
          </div>
        </div>

        <div>
          <label htmlFor="feedback-comment" className="text-xs font-medium text-foreground block mb-1.5">
            Comments (optional)
          </label>
          <Textarea
            id="feedback-comment"
            placeholder="Share details about technician professionalism, timeliness, or fix quality..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
            rows={3}
            className="text-sm bg-background"
          />
          <span className="text-[11px] text-muted-foreground text-end block mt-1">
            {comment.length} / 500 characters
          </span>
        </div>

        <Button
          onClick={() => submitMutation.mutate()}
          disabled={submitMutation.isPending}
          className="w-full sm:w-auto"
        >
          {submitMutation.isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
          Submit Service Feedback
        </Button>
      </CardContent>
    </Card>
  );
}
