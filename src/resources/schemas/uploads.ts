import { UploadStatus as PrismaUploadStatus } from '@prisma/client';
import { z } from 'zod';

/**
 * Zod schemas for file uploads
 */
const UploadStatus = z.nativeEnum(PrismaUploadStatus);
const ACCEPTED_CONTENT_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/jpg',
  'image/png',
];

const UploadRequestBodySchema = z.object({
  originalFilename: z.string(),
  contentType: z.string().refine((contentType: string) => {
    const mediaType = contentType.split(';')[0];
    return ACCEPTED_CONTENT_TYPES.includes(mediaType);
  }),
});

const UploadStateRequestBodySchema = z.object({
  status: UploadStatus,
});

const UploadStateResponseBodySchema = z.object({
  id: z.number(),
  originalFilename: z.string(),
  status: UploadStatus,
});

const UploadResponseBodySchema = z.object({
  id: z.number(),
  signedLink: z.string(),
});

export {
  UploadRequestBodySchema,
  UploadResponseBodySchema,
  UploadStateRequestBodySchema,
  UploadStateResponseBodySchema,
};
