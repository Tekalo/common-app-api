import { z } from 'zod';

const OrgType = z.enum(['nonprofit', 'government']);
const EmploymentType = z.enum([
  'full-time job',
  'volunteer',
  'contractor',
  'consultant',
  'advisor',
  'internship',
  'other',
]);
const OrgSize = z.enum(['<50', '>50']);

const OpportunityBatchRequestBodySchema = z.object({
  organization: z.object({
    name: z.string(),
    type: OrgType,
    size: OrgSize,
    impactAreas: z.array(z.string()),
    eoe: z.boolean(),
  }),
  contact: z.object({
    name: z.string(),
    email: z.string(),
    phone: z.string(),
  }),
  submissions: z.array(
    z.object({
      roleType: z.string(),
      positionTitle: z.string(),
      fullyRemote: z.boolean(),
      hoursPerWeek: z.string().nullable().optional(),
      location: z.string(),
      paid: z.boolean(),
      pitchEssay: z.string(),
      source: z.string(),
      employmentType: EmploymentType,
    }),
  ),
});

const OpportunityBatchResponseBodySchema = z.object({
  id: z.number(),
  contactEmail: z.string(),
  contactName: z.string(),
  contactPhone: z.string(),
  impactAreas: z.array(z.string()),
  orgName: z.string(),
  orgSize: z.string(),
  orgType: z.string(),
});

export {
  OpportunityBatchRequestBodySchema,
  OpportunityBatchResponseBodySchema,
};
