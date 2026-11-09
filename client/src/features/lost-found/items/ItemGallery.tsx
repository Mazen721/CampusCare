import { ImageOff } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Lightbox } from '@/components/shared/Lightbox';
import type { ImageAsset } from '@/types/maintenance';

interface ItemGalleryProps {
  images: ImageAsset[];
  itemTitle: string;
}

export function ItemGallery({ images, itemTitle }: ItemGalleryProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [initialIndex, setInitialIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex min-h-[260px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/30 p-8 text-center">
        <ImageOff className="h-8 w-8 text-muted-foreground" strokeWidth={1.6} aria-hidden="true" />
        <p className="text-sm font-medium text-foreground">{t('lostFound.noPhotosAttached')}</p>
        <p className="text-xs text-muted-foreground">
          {t('lostFound.noPhotosAttachedDesc')}
        </p>
      </div>
    );
  }

  return (
    <>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {images.map((image, index) => (
          <li key={`${image.publicId}-${index}`}>
            <button
              type="button"
              onClick={() => {
                setInitialIndex(index);
                setOpen(true);
              }}
              className="group relative block aspect-[4/3] w-full overflow-hidden rounded-md border bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label={t('requests.openPhotoAria', { index: index + 1, total: images.length })}
            >
              <img
                src={image.url}
                alt={t('lostFound.itemPhoto', { title: itemTitle })}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
            </button>
          </li>
        ))}
      </ul>

      <Lightbox
        images={images}
        open={open}
        onOpenChange={setOpen}
        initialIndex={initialIndex}
        title={itemTitle}
      />
    </>
  );
}
