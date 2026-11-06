import { Schema } from 'mongoose';

export interface ImageAsset {
  url: string;
  publicId: string;
}

/** Embedded image reference used by requests, reports and claims. */
export const imageSchema = new Schema<ImageAsset>(
  {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, required: true, trim: true },
  },
  { _id: false },
);

export function maxImagesValidator(value: ImageAsset[]): boolean {
  return value.length <= 3;
}

export const MAX_IMAGES_MESSAGE = 'A maximum of 3 images is allowed';
