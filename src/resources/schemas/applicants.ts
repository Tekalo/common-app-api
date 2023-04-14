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
const OpenToRemote = z.enum(['yes', 'no', 'both', 'not sure']);
const WorkAuthorization = z.enum(['authorized', 'sponsorship']);
const ReferenceAttribution = z.enum([
  'website',
  'linkedin',
  'social media',
  'partner organization',
  'career fair',
  'other',
]);
const EmploymentType = z.enum(['full', 'part']);

const ApplicantRequestBodySchema = z.object({
  name: z.string(),
  email: z.string().email(),
  pronoun: z.string().optional(),
  preferredContact: PreferredContact,
  searchStatus: SearchStatus,
  acceptedTerms: z.literal(true),
  acceptedPrivacy: z.literal(true),
});

const ApplicantResponseBodySchema = z.object({
  id: z.number(),
  auth0Id: z.string().nullable(),
  email: z.string(),
});

const ApplicantSubmissionRequestBodySchema = z.object({
  // TODO re name these they are way 2 long
  originTag: z.string(),
  lastRole: z.string(),
  lastOrg: z.string(),
  yoe: YOE,
  skills: z.array(Skills),
  otherSkills: z.array(z.string()),
  linkedInUrl: z.string().nullable().optional(),
  githubUrl: z.string().nullable().optional(),
  portfolioUrl: z.string().nullable().optional(),
  portfolioPassword: z.string().nullable().optional(),
  resumeUrl: z.string().optional(),
  resumePassword: z.string().nullable().optional(),
  hoursPerWeek: z.string().nullable().optional(),
  interestEmploymentType: z.array(EmploymentType),
  interestRoles: z.array(z.string()), // keep this as non-zod-enum?
  currentLocation: z.string(),
  openToRelocate: OpenToRelocate,
  openToRemote: OpenToRemote,
  desiredSalary: z.string().nullable().optional(),
  interestCauses: z.array(z.string()), // order matters
  otherCauses: z.array(z.string()).nullable(),
  workAuthorization: WorkAuthorization,
  interestGovt: z.boolean(),
  interestGovtEmplTypes: z.array(InterestGovtEmplTypes).optional(),
  previousImpactExperience: z.boolean(),
  essayResponse: z.string(),
  referenceAttribution: ReferenceAttribution.nullable().optional(),
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
  ApplicantDraftSubmissionResponseBodySchema,
};
