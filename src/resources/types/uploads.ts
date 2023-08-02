import { z } from 'zod';
import {
  UploadRequestBodySchema,
  UploadResponseBodySchema,
  UploadStateResponseBodySchema,
} from '../schemas/uploads.js';

export type UploadRequestBody = z.infer<typeof UploadRequestBodySchema>;
export type UploadStateRequestBody = z.infer<typeof UploadRequestBodySchema>;
export type UploadResponseBody = z.infer<typeof UploadResponseBodySchema>;
export type UploadStateResponseBody = z.infer<
  typeof UploadStateResponseBodySchema
>;
