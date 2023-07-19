import { z } from 'zod';
import {
  UploadRequestBodySchema,
  UploadResponseBodySchema,
} from '../schemas/uploads.js';

export type UploadRequestBody = z.infer<typeof UploadRequestBodySchema>;
export type UploadResponseBody = z.infer<typeof UploadResponseBodySchema>;
