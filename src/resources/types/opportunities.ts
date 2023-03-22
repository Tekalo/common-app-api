import { z } from 'zod';
import {
  OpportunityBatchRequestBodySchema,
  OpportunityBatchResponseBodySchema,
} from '../schemas/opportunities.js';

export type OpportunityBatchRequestBody = z.infer<
  typeof OpportunityBatchRequestBodySchema
>;

export type OpportunityBatchResponseBody = z.infer<
  typeof OpportunityBatchResponseBodySchema
>;
