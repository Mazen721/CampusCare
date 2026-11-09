import { ImagePlus, X } from 'lucide-react';
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024;

interface ImageUploadProps {
  files: File[];
  onChange: (files: File[]) => void;
  maxFiles?: number;
  disabled?: boolean;
  error?: string;
}

export function ImageUpload({
  files,
  onChange,
  maxFiles = 3,
  disabled = false,
  error,
}: ImageUploadProps) {
  const { t } = useTranslation();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const previews = useMemo(
    () => files.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [files],
  );

  useEffect(() => {
    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [previews]);

  const addFiles = (incoming: FileList | File[]) => {
    const accepted: File[] = [];
    let message: string | null = null;

    Array.from(incoming).forEach((file) => {
      if (files.length + accepted.length >= maxFiles) {
        message = t('serverErrors.uploadTooLarge');
        return;
      }
      if (!ACCEPTED_TYPES.includes(file.type)) {
        message = t('serverErrors.uploadInvalid');
        return;
      }
      if (file.size > MAX_BYTES) {
        message = t('serverErrors.uploadTooLarge');
        return;
      }
      accepted.push(file);
    });

    if (accepted.length > 0) {
      onChange([...files, ...accepted]);
    }
    setLocalError(message);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) addFiles(event.target.files);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    if (disabled) return;
    addFiles(event.dataTransfer.files);
  };

  const removeFile = (index: number) => {
    onChange(files.filter((_, fileIndex) => fileIndex !== index));
    setLocalError(null);
  };

  const displayError = error ?? localError;

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        multiple
        className="sr-only"
        onChange={handleInputChange}
        disabled={disabled}
      />

      <div
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          'rounded-lg border border-dashed border-input bg-muted/20 px-4 py-5 text-center transition-colors',
          dragging && 'border-primary bg-primary/5',
          disabled && 'opacity-60',
        )}
      >
        <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-card text-primary shadow-sm">
            <ImagePlus className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
          </span>
          <p className="text-sm font-medium text-foreground">
            {t('common.upload')}
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            JPEG, PNG, WebP · max {maxFiles} · 5 MB
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-1"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || files.length >= maxFiles}
          >
            {t('common.upload')}
          </Button>
          <p className="text-[11px] text-muted-foreground">
            {files.length} / {maxFiles}
          </p>
        </div>
      </div>

      {previews.length > 0 ? (
        <ul className="grid grid-cols-3 gap-2" aria-label={t('common.preview')}>
          {previews.map((preview, index) => (
            <li
              key={`${preview.file.name}-${preview.file.lastModified}-${index}`}
              className="group relative aspect-square overflow-hidden rounded-md border bg-muted"
            >
              <img
                src={preview.url}
                alt={preview.file.name}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeFile(index)}
                disabled={disabled}
                aria-label={t('common.remove')}
                className="absolute end-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-stone-950/75 text-white transition-colors hover:bg-destructive focus-visible:ring-2 focus-visible:ring-white"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {displayError ? (
        <p className="text-xs font-medium text-destructive" role="alert">
          {displayError}
        </p>
      ) : null}
    </div>
  );
}
