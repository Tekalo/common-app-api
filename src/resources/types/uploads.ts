import { z } from 'zod';
import { Uploads } from 'schemas';

export type UploadRequestBody = z.infer<typeof Uploads.UploadRequestBodySchema>;
export type UploadResponseBody = z.infer<
  typeof Uploads.UploadResponseBodySchema
>;
export type UploadStateRequestBody = z.infer<
  typeof Uploads.UploadStateRequestBodySchema
>;
export type UploadStateResponseBody = z.infer<
  typeof Uploads.UploadStateResponseBodySchema
>;
