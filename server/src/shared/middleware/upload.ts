import multer from 'multer';
import { IMAGE_MAX_BYTES, IMAGE_MAX_COUNT, IMAGE_MIME_TYPES } from '../../config/constants';
import { ApiError } from '../utils/ApiError';

const allowedMimeTypes = new Set<string>(IMAGE_MIME_TYPES);

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: IMAGE_MAX_BYTES,
    files: IMAGE_MAX_COUNT,
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(
        new ApiError(
          415,
          'UPLOAD_INVALID',
          'Only JPEG, PNG and WebP images are allowed. Please choose a different file.',
        ),
      );
      return;
    }

    callback(null, true);
  },
});

/**
 * Accepts up to three images in the multipart field `images`. Files stay in
 * memory until the service streams them to Cloudinary or local development disk.
 */
export const uploadRequestImages = imageUpload.array('images', IMAGE_MAX_COUNT);
