import { z } from 'zod';
import { Opportunities } from 'schemas';

export type OpportunityBatchRequestBody = z.infer<
  typeof Opportunities.OpportunityBatchRequestBodySchema
>;

export type OpportunityBatchResponseBody = z.infer<
  typeof Opportunities.OpportunityBatchResponseBodySchema
>;

export type OpportunitySubmission = z.infer<
  typeof Opportunities.OpportunitySubmissionSchema
>;
