import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import type { ImageAsset } from '@/types/maintenance';

interface LightboxProps {
  images: ImageAsset[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialIndex?: number;
  title?: string;
}

export function Lightbox({
  images,
  open,
  onOpenChange,
  initialIndex = 0,
  title = 'Attachment',
}: LightboxProps) {
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    if (open) {
      setIndex(Math.min(Math.max(initialIndex, 0), Math.max(images.length - 1, 0)));
    }
  }, [open, initialIndex, images.length]);

  if (images.length === 0) return null;

  const safeIndex = Math.min(index, images.length - 1);
  const current = images[safeIndex];
  const hasPrevious = safeIndex > 0;
  const hasNext = safeIndex < images.length - 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showClose={false}
        className="max-w-5xl gap-0 overflow-hidden border-stone-800 bg-stone-950 p-0 text-white"
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft' && hasPrevious) setIndex(safeIndex - 1);
          if (event.key === 'ArrowRight' && hasNext) setIndex(safeIndex + 1);
        }}
      >
        <DialogTitle className="sr-only">{title} preview</DialogTitle>
        <DialogDescription className="sr-only">
          Image {safeIndex + 1} of {images.length}. Use the arrow keys to move between images.
        </DialogDescription>

        <div className="flex items-center justify-between gap-3 border-b border-stone-800 px-4 py-3">
          <p className="text-xs font-medium text-stone-300" aria-live="polite">
            {title} · {safeIndex + 1} of {images.length}
          </p>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close image preview"
            className="rounded-full p-1.5 text-stone-300 transition-colors hover:bg-stone-800 hover:text-white focus-visible:ring-2 focus-visible:ring-white"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="relative flex min-h-[280px] items-center justify-center bg-black">
          {current ? (
            <img
              src={current.url}
              alt={`${title} ${safeIndex + 1} of ${images.length}`}
              className="max-h-[70vh] w-full object-contain"
            />
          ) : null}
        </div>

        {images.length > 1 ? (
          <div className="flex items-center justify-between gap-3 border-t border-stone-800 px-4 py-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIndex(safeIndex - 1)}
              disabled={!hasPrevious}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              Previous
            </Button>
            <div className="flex items-center gap-1.5" aria-hidden="true">
              {images.map((image, dotIndex) => (
                <span
                  key={`${image.publicId}-${dotIndex}`}
                  className={
                    dotIndex === safeIndex
                      ? 'h-1.5 w-4 rounded-full bg-amber-400'
                      : 'h-1.5 w-1.5 rounded-full bg-stone-600'
                  }
                />
              ))}
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIndex(safeIndex + 1)}
              disabled={!hasNext}
            >
              Next
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
