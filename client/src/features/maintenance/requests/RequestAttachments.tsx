import { ImageIcon } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Lightbox } from '@/components/shared/Lightbox';
import type { ImageAsset } from '@/types/maintenance';

interface RequestAttachmentsProps {
  attachments: ImageAsset[];
  title: string;
}

export function RequestAttachments({ attachments, title }: RequestAttachmentsProps) {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (attachments.length === 0) return null;

  return (
    <div className="space-y-2.5">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" />
        {t('requests.photosCount', { count: attachments.length })}
      </p>
      <ul className="grid grid-cols-3 gap-2 sm:max-w-md">
        {attachments.map((attachment, index) => (
          <li key={attachment.publicId || attachment.url}>
            <button
              type="button"
              onClick={() => setActiveIndex(index)}
              className="group relative aspect-square w-full overflow-hidden rounded-md border bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              aria-label={t('requests.openPhotoAria', { index: index + 1, total: attachments.length })}
            >
              <img
                src={attachment.url}
                alt={`${title} photo ${index + 1}`}
                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
              />
            </button>
          </li>
        ))}
      </ul>

      <Lightbox
        images={attachments}
        open={activeIndex !== null}
        onOpenChange={(open) => {
          if (!open) setActiveIndex(null);
        }}
        initialIndex={activeIndex ?? 0}
        title={title}
      />
    </div>
  );
}
