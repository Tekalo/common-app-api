import { z } from 'zod';

/**
 * Zod schemas for file uploads
 */
const UploadRequestBodySchema = z.object({
  originalFilename: z.string().optional(),
});

const UploadResponseBodySchema = z.object({
  uploadId: z.number(),
  signedLink: z.string(),
});

export { UploadRequestBodySchema, UploadResponseBodySchema };
