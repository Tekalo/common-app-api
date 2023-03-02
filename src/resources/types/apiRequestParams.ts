import { z } from 'zod';
import ApplicantQueryParamsSchema from '@App/resources/zodSchemas/apiRequestParamsSchemas.js';

export type ApplicantQueryParams = z.infer<typeof ApplicantQueryParamsSchema>;
