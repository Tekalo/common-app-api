import { z } from 'zod';

const OrgType = z.enum(['nonprofit', 'government']);
const OrgSize = z.enum(['<50', '>50']);

const OpportunityRequestBodySchema = z.array(
  z.object({
    fullTime: z.boolean(),
    contact: z.object({
      name: z.string(),
      email: z.string(),
      phone: z.string(),
    }),
    organization: z.object({
      name: z.string(),
      type: OrgType,
      size: OrgSize,
    }),
  }),
);

const OpportunityResponseBodySchema = z.object({
  count: z.number(),
});

export { OpportunityRequestBodySchema, OpportunityResponseBodySchema };
