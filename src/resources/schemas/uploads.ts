import { UploadStatus as PrismaUploadStatus } from '@prisma/client';
import { z } from 'zod';

/**
 * Zod schemas for file uploads
 */
const UploadStatus = z.nativeEnum(PrismaUploadStatus);
const MimeType = z.enum(['pdf', 'docx', 'jpeg', 'jpg', 'png']);

const UploadRequestBodySchema = z.object({
  originalFilename: z.string(),
  mimeType: MimeType,
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
