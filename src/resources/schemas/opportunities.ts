import { z } from 'zod';

const OrgType = z.enum(['nonprofit', 'government']);
const OrgSize = z.enum(['<50', '>50']);

const OpportunityRequestBodySchema = z.array(
  z.object({
    contact: z.object({
      name: z.string(),
      email: z.string(),
      phone: z.string(),
    }),
    fullTime: z.boolean(),
    impactArea: z.array(z.string()),
    location: z.string(),
    organization: z.object({
      name: z.string(),
      type: OrgType,
      size: OrgSize,
    }),
    paid: z.boolean(),
    pitchEssay: z.string(),
    source: z.string(),
    type: z.string(),
  }),
);

const OpportunityResponseBodySchema = z.object({
  id: z.number(),
});

export { OpportunityRequestBodySchema, OpportunityResponseBodySchema };
