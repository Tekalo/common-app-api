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

const OpportunityResponseBodySchema = z.array(
  z.object({
    id: z.number(),
    opportunityBatchId: z.number(),
    orgName: z.string(),
    dateAdded: z.date(),
    source: z.string(),
    type: z.string(),
    orgType: z.string(),
    orgSize: z.string(),
    impactArea: z.array(z.string()),
    contactName: z.string(),
    contactEmail: z.string(),
    contactPhone: z.string(),
    paid: z.boolean(),
    fullTime: z.boolean().nullable(),
    roleType: z.string().nullable(),
    salaryRange: z.string().nullable(),
    location: z.string(),
    visaSponsorship: z.string().nullable(),
    desiredStartDate: z.date().nullable(),
    desiredEndDate: z.date().nullable(),
    desiredYoe: z.number().nullable(),
    desiredSkills: z.array(z.string()),
    desiredSkillsOther: z.array(z.string()),
    desiredImpactExp: z.string().nullable(),
    similarStaffed: z.boolean().nullable(),
    jdUrl: z.string().nullable(),
    pitchEssay: z.string(),
  }),
);

export { OpportunityRequestBodySchema, OpportunityResponseBodySchema };
