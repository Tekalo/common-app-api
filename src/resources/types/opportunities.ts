import { z } from 'zod';
import {
  OpportunityRequestBodySchema,
  OpportunityResponseBodySchema,
} from '../schemas/opportunities.js';

export type OpportunityRequestBody = z.infer<
  typeof OpportunityRequestBodySchema
>;

export type OpportunityResponseBody = z.infer<
  typeof OpportunityResponseBodySchema
>;
