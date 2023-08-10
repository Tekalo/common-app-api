import { z } from 'zod';
import {
  OpportunityBatchRequestBodySchema,
  OpportunityBatchResponseBodySchema,
  OpportunitySubmissionSchema,
} from '../schemas/opportunities.js';

export type OpportunityBatchRequestBody = z.infer<
  typeof OpportunityBatchRequestBodySchema
>;

export type OpportunityBatchResponseBody = z.infer<
  typeof OpportunityBatchResponseBodySchema
>;

export type OpportunitySubmission = z.infer<typeof OpportunitySubmissionSchema>;
