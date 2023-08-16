import { z } from 'zod';
import { opportunities } from 'schemas';

export type OpportunityBatchRequestBody = z.infer<
  typeof opportunities.OpportunityBatchRequestBodySchema
>;

export type OpportunityBatchResponseBody = z.infer<
  typeof opportunities.OpportunityBatchResponseBodySchema
>;

export type OpportunitySubmission = z.infer<
  typeof opportunities.OpportunitySubmissionSchema
>;
