import { z } from 'zod';
import ApplicantBodySchema from '@App/resources/zodSchemas/apiRequestBodySchemas.js';

export type ApplicantBody = z.infer<typeof ApplicantBodySchema>;
