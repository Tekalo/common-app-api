import { z } from 'zod';

const OrgType = z.enum(['501c(3)', 'other']);
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

const EmploymentType = z.enum([
  'full-time employee',
  'volunteer',
  'contractor',
  'consultant',
  'advisor',
  'internship',
  'other',
]);
const YOE = z.enum(['0-2', '2-4', '4-8', '8-12', '12-15', '15+']);

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
    email: z.string().max(255),
    phone: z.string().max(255),
  }),
  submissions: z.array(
    z.object({
      roleType: z.string().max(255),
      positionTitle: z.string().max(255),
      fullyRemote: z.boolean(),
      location: z.string(),
      paid: z.boolean(),
      pitchEssay: z.string().max(5000),
      source: z.string(),
      employmentType: EmploymentType,
      salaryRange: z.string().max(255),
      desiredHoursPerWeek: z.string().max(255).nullable().optional(),
      desiredStartDate: z.coerce.date().optional(),
      desiredEndDate: z.coerce.date().optional(),
      jdUrl: z.string().max(500).optional(),
      desiredYoe: z.array(YOE),
      desiredSkills: z.array(Skills),
      desiredOtherSkills: z.string().max(255).optional(),
      visaSponsorship: VisaSponsorship,
      similarStaffed: z.boolean(),
      desiredImpactExp: z.string().max(255).optional(),
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
