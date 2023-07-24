import { z } from 'zod';

/**
 * Zod schemas for file uploads
 */

const MimeType = z.enum(['pdf', 'docx', 'rtf', 'odt']);

const UploadRequestBodySchema = z.object({
  // TODO re name these they are way 2 long
  originalFilename: z.string(),
  mimeType: MimeType,
});

const UploadResponseBodySchema = z.object({
  uploadId: z.number(),
  signedLink: z.string(),
});

export { UploadRequestBodySchema, UploadResponseBodySchema };
