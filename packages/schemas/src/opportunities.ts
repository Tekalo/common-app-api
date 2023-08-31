import { z } from 'zod';

const OrgType = z.enum(['501(c)(3)', '501(c)(4)', 'llc', 'b corp', 'other']);
const OrgSize = z.enum([
  '<20',
  '20-50',
  '51-100',
  '101-200',
  '201-500',
  '500+',
]);
const VisaSponsorship = z.enum(['yes', 'no', 'sometimes']);
const Skills = z.enum([
  'react',
  'javascript',
  'python',
  'java',
  'sql',
  'privacy',
  'security',
  'devops',
  'figma',
  'sketch',
  'prototyping',
  'user research',
  'product development',
  'project management',
]);

// Deprecated: '2-4', '4-8', '8-12', '12-15'
// TODO: Remove support for deprecated options
const YOE = z.enum([
  '0-2',
  '3-5',
  '6-8',
  '9-12',
  '13-15',
  '15+',
  '2-4',
  '4-8',
  '8-12',
  '12-15',
]);

const OpportunitySubmissionSchema = z.object({
  roleType: z.string(),
  otherRoleType: z.string().optional(),
  positionTitle: z.string().max(255),
  fullyRemote: z.boolean(),
  location: z.string().optional(),
  paid: z.boolean(),
  pitchEssay: z.string().max(5000),
  source: z.string(),
  employmentType: z.string().max(255), // UI has dropdown, but they have input box for an "other" option
  salaryRange: z.string().max(255).optional(),
  desiredHoursPerWeek: z.string().max(255).nullable().optional(),
  desiredStartDate: z.coerce.date().optional(),
  desiredEndDate: z.coerce.date().optional(),
  jdUrl: z.string().max(500).optional(),
  desiredYoe: z.array(YOE),
  desiredSkills: z.array(Skills).optional(),
  desiredOtherSkills: z.array(z.string()).optional(),
  visaSponsorship: VisaSponsorship.optional(),
  similarStaffed: z.boolean(),
  desiredImpactExp: z.string().max(5000).optional(),
});

const OpportunityBatchRequestBodySchema = z.object({
  organization: z.object({
    name: z.string().max(255),
    type: OrgType,
    size: OrgSize,
    impactAreas: z.array(z.string().max(255)),
    eoe: z.boolean(),
  }),
  contact: z.object({
    name: z.string().max(255),
    email: z.string().email().toLowerCase(),
    phone: z.string().max(255).nullable().optional(),
  }),
  acceptedPrivacy: z.literal(true),
  referenceAttribution: z.string().nullable().optional(),
  referenceAttributionOther: z.string().nullable().optional(),
  submissions: z.array(OpportunitySubmissionSchema),
});

const OpportunityBatchResponseBodySchema = z.object({
  id: z.number(),
  acceptedPrivacy: z.date(),
  contactEmail: z.string(),
  contactName: z.string(),
  contactPhone: z.string().nullable(),
  impactAreas: z.array(z.string()),
  orgName: z.string(),
  orgSize: z.string(),
  orgType: z.string(),
});

export default {
  OpportunityBatchRequestBodySchema,
  OpportunitySubmissionSchema,
  OpportunityBatchResponseBodySchema,
};