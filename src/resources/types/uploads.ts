import { z } from 'zod';
import {
  UploadRequestBodySchema,
  UploadResponseBodySchema,
  UploadStateRequestBodySchema,
  UploadStateResponseBodySchema,
} from '../schemas/uploads.js';

export type UploadRequestBody = z.infer<typeof UploadRequestBodySchema>;
export type UploadResponseBody = z.infer<typeof UploadResponseBodySchema>;
export type UploadStateRequestBody = z.infer<
  typeof UploadStateRequestBodySchema
>;
export type UploadStateResponseBody = z.infer<
  typeof UploadStateResponseBodySchema
>;
