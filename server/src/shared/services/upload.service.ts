import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';
import { env } from '../../config/env';
import type { ImageAsset } from '../schemas/image.schema';
import { ApiError } from '../utils/ApiError';

export const LOCAL_UPLOADS_DIR = path.resolve(__dirname, '../../../uploads');

const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

let cloudinaryConfigured = false;

function configureCloudinary(): void {
  if (cloudinaryConfigured || !env.CLOUDINARY_CONFIGURED) {
    return;
  }

  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  cloudinaryConfigured = true;
}

async function uploadToCloudinary(file: Express.Multer.File): Promise<ImageAsset> {
  configureCloudinary();

  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'campuscare', resource_type: 'image' },
      (error, uploaded) => {
        if (error || !uploaded) {
          reject(error ?? new Error('Cloudinary returned an empty upload result'));
          return;
        }
        resolve(uploaded);
      },
    );

    uploadStream.end(file.buffer);
  });

  return { url: result.secure_url, publicId: result.public_id };
}

async function uploadToLocalDisk(
  file: Express.Multer.File,
  baseUrl?: string,
): Promise<ImageAsset> {
  if (env.IS_PRODUCTION) {
    throw new ApiError(
      503,
      'UPLOAD_UNAVAILABLE',
      'Image uploads are not configured on this server yet. Please try again later.',
      'uploadUnavailable',
    );
  }

  const extension = EXTENSION_BY_MIME[file.mimetype] ?? 'jpg';
  const filename = `${randomUUID()}.${extension}`;

  await mkdir(LOCAL_UPLOADS_DIR, { recursive: true });
  await writeFile(path.join(LOCAL_UPLOADS_DIR, filename), file.buffer);

  const origin = (baseUrl ?? `http://localhost:${env.PORT}`).replace(/\/$/, '');
  return {
    url: `${origin}/uploads/${filename}`,
    publicId: `local:${filename}`,
  };
}

/**
 * Uploads request/claim/report images. Cloudinary is used when configured;
 * otherwise development and test environments write to `server/uploads/`.
 */
export async function uploadImages(
  files: Express.Multer.File[],
  baseUrl?: string,
): Promise<ImageAsset[]> {
  if (files.length === 0) {
    return [];
  }

  return Promise.all(
    files.map((file) =>
      env.CLOUDINARY_CONFIGURED
        ? uploadToCloudinary(file)
        : uploadToLocalDisk(file, baseUrl),
    ),
  );
}
