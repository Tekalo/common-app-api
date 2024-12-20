import { z } from 'zod';

/**
 * Zod schemas for file uploads
 */
const UploadStatus = z.enum(['REQUESTED', 'SUCCESS', 'FAILURE']);
const ACCEPTED_CONTENT_TYPES: Map<string, string> = new Map<string, string>([
  ['application/pdf', 'pdf'],
  [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'docx',
  ],
  ['image/jpeg', 'jpeg'],
  ['image/jpg', 'jpeg'],
  ['image/png', 'png'],
]);

const UploadRequestBodySchema = z.object({
  originalFilename: z.string(),
  contentType: z.string().refine((contentType: string) => {
    const mediaType = contentType.split(';')[0];
    return ACCEPTED_CONTENT_TYPES.has(mediaType);
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
  // TODO: should these be optional? not sure a good way to handle the two variants
  signedLink: z.string().optional(),
  presignedPost: z
    .object({
      url: z.string(),
      fields: z.record(z.string()),
    })
    .optional(),
});

export default {
  ACCEPTED_CONTENT_TYPES,
  UploadRequestBodySchema,
  UploadResponseBodySchema,
  UploadStateRequestBodySchema,
  UploadStateResponseBodySchema,
};
