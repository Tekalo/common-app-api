import { z } from 'zod';

/**
 * Zod schemas for file uploads
 */

const MimeType = z.enum(['pdf', 'docx', 'jpeg', 'jpg', 'png']);

const UploadRequestBodySchema = z.object({
  originalFilename: z.string(),
  mimeType: MimeType,
});

const UploadResponseBodySchema = z.object({
  uploadId: z.number(),
  signedLink: z.string(),
});

export { UploadRequestBodySchema, UploadResponseBodySchema };
