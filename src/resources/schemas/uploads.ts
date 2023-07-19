import { z } from 'zod';

/**
 * Zod schemas for file uploads
 */
const UploadRequestBodySchema = z.object({
  // TODO re name these they are way 2 long
  originalFilename: z.string().optional(),
});

const UploadResponseBodySchema = z.object({
  uploadId: z.number(),
  signedLink: z.string(),
});

export { UploadRequestBodySchema, UploadResponseBodySchema };
