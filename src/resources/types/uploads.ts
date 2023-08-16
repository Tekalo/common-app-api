import { z } from 'zod';
import { uploads } from 'schemas';

export type UploadRequestBody = z.infer<typeof uploads.UploadRequestBodySchema>;
export type UploadResponseBody = z.infer<
  typeof uploads.UploadResponseBodySchema
>;
export type UploadStateRequestBody = z.infer<
  typeof uploads.UploadStateRequestBodySchema
>;
export type UploadStateResponseBody = z.infer<
  typeof uploads.UploadStateResponseBodySchema
>;
