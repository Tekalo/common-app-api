import { z } from 'zod';

const PreferredContact = z.enum(['sms', 'whatsapp', 'email']);
const SearchStatus = z.enum(['active', 'passive', 'future']);
const InterestGovtEmplTypes = z.enum(['paid', 'unpaid']);
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
const YOE = z.enum([
  '<1',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  '>11',
]);
const OpenToRelocate = z.enum(['yes', 'no', 'not sure']);

// Temporarily overloading enum for backward compatibility.
// Final list is: ['remote', 'in-person', 'hybrid', 'not sure']
const OpenToRemote = z.enum([
  'only remote',
  'remote',
  'no remote',
  'in-person',
  'both',
  'hybrid',
  'not sure',
]);
const WorkAuthorization = z.enum(['authorized', 'sponsorship']);
const EmploymentType = z.enum(['full', 'part']);

const ApplicantRequestBodySchema = z.object({
  name: z.string().max(255),
  email: z.string().email(),
  phone: z.string().optional(),
  pronoun: z.string().max(255).optional(),
  preferredContact: PreferredContact,
  searchStatus: SearchStatus,
  acceptedTerms: z.literal(true),
  acceptedPrivacy: z.literal(true),
  followUpOptIn: z.boolean().optional(),
});

const ApplicantStateRequestBodySchema = z.object({
  pause: z.boolean(),
});

const ApplicantUpdateRequestBodySchema = z.object({
  auth0Id: z.string(),
});

const ApplicantResponseBodySchema = z.object({
  id: z.number(),
  auth0Id: z.string().nullable(),
  email: z.string(),
});

const ApplicantSubmissionRequestBodySchema = z.object({
  // TODO re name these they are way 2 long
  originTag: z.string(),
  lastRole: z.string().max(255),
  lastOrg: z.string().max(255),
  yoe: YOE,
  skills: z.array(Skills),
  otherSkills: z.array(z.string().max(255)),
  linkedInUrl: z.string().max(500).nullable().optional(),
  githubUrl: z.string().max(500).nullable().optional(),
  portfolioUrl: z.string().max(500).nullable().optional(),
  portfolioPassword: z.string().max(255).nullable().optional(),
  resumeUrl: z.string().max(500).optional(),
  resumePassword: z.string().max(255).nullable().optional(),
  hoursPerWeek: z.string().max(255).nullable().optional(),
  interestEmploymentType: z.array(EmploymentType),
  interestWorkArrangement: z.array(z.string()).optional(),
  interestRoles: z.array(z.string().max(255)),
  currentLocation: z.string().max(255),
  openToRelocate: OpenToRelocate,
  openToRemote: z.array(OpenToRemote).or(OpenToRemote), // TODO: Remove support for a single string
  desiredSalary: z.string().max(255).nullable().optional(),
  interestCauses: z.array(z.string().max(255)), // order matters
  otherCauses: z.array(z.string().max(255)).nullable(),
  workAuthorization: WorkAuthorization.optional(),
  interestGovt: z.boolean(),
  interestGovtEmplTypes: z.array(InterestGovtEmplTypes).optional(),
  previousImpactExperience: z.boolean(),
  essayResponse: z.string().max(5000),
  referenceAttribution: z.string().nullable().optional(),
});
// TOOD: Figure out typesript error on refining interestGovtTypes to ensure it is filled if interestGovt is true

const ApplicantDraftSubmissionRequestBodySchema =
  ApplicantSubmissionRequestBodySchema.partial();

const ApplicantDraftSubmissionResponseBodySchema = z.object({
  submission: ApplicantDraftSubmissionRequestBodySchema,
  isFinal: z.boolean(),
});

export {
  ApplicantRequestBodySchema,
  ApplicantResponseBodySchema,
  ApplicantSubmissionRequestBodySchema,
  ApplicantDraftSubmissionRequestBodySchema,
  ApplicantStateRequestBodySchema,
  ApplicantDraftSubmissionResponseBodySchema,
  ApplicantUpdateRequestBodySchema,
};
