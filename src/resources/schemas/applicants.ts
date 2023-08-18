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

const OpenToRemote = z.enum(['remote', 'in-person', 'hybrid', 'not sure']);
const WorkAuthorization = z.enum(['authorized', 'sponsorship']);
const EmploymentType = z.enum(['full', 'part']);

const ApplicantRequestBodySchema = z.object({
  name: z.string().max(255),
  email: z.string().email().toLowerCase(),
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

const ApplicantCreateSubmissionRequestBodySchema = z.object({
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
  resumeUrl: z.string().max(500).optional(), // deprecated
  resumeUploadId: z.number().nullable().optional(),
  resumePassword: z.string().max(255).nullable().optional(),
  hoursPerWeek: z.string().max(255).nullable().optional(),
  interestEmploymentType: z.array(EmploymentType),
  interestWorkArrangement: z.array(z.string()).optional(),
  interestRoles: z.array(z.string().max(255)),
  currentLocation: z.string().max(255),
  openToRelocate: OpenToRelocate,
  openToRemote: z.array(OpenToRemote).optional(), // TODO: Remove support
  openToRemoteMulti: z.array(OpenToRemote).optional(), // TODO: Remove optional
  desiredSalary: z.string().max(255).nullable().optional(),
  interestCauses: z.array(z.string().max(255)), // order matters
  otherCauses: z.array(z.string().max(255)).nullable(),
  workAuthorization: WorkAuthorization.optional(),
  interestGovt: z.boolean(),
  interestGovtEmplTypes: z.array(InterestGovtEmplTypes).optional(),
  previousImpactExperience: z.boolean(),
  essayResponse: z.string().max(5000),
  referenceAttribution: z.string().nullable().optional(),
  referenceAttributionOther: z.string().nullable().optional(),
});

const ApplicantCreateSubmissionResponseBodySchema = z.object({
  id: z.number(),
  applicantId: z.number(),
  createdAt: z.date(), // TBD??
  originTag: z.string(),
  lastRole: z.string().max(255),
  lastOrg: z.string().max(255),
  yoe: z.string(), // YOE should be an enum
  skills: z.array(z.string()), // Skills should be an enum
  otherSkills: z.array(z.string().max(255)),
  linkedInUrl: z.string().max(500).nullable(),
  githubUrl: z.string().max(500).nullable(),
  portfolioUrl: z.string().max(500).nullable(),
  portfolioPassword: z.string().max(255).nullable(),
  // resumeUploadId: z.number().nullable(), // REMOVE ME BEFORE MERGE!!
  resumeUpload: z
    .object({
      id: z.number(),
      originalFilename: z.string(),
    })
    .nullable(),
  resumeUrl: z.string().max(500).nullable(), // deprecated
  resumePassword: z.string().max(255).nullable(),
  hoursPerWeek: z.string().max(255).nullable(),
  interestEmploymentType: z.array(z.string()), // z.array(InterestEmploymentType) should be an enum
  interestWorkArrangement: z.array(z.string()),
  interestRoles: z.array(z.string().max(255)),
  currentLocation: z.string().max(255),
  openToRelocate: z.string(), // OpenToRelocate should be an enum
  openToRemote: z.string().nullable(), // TODO: Remove support  // z.array(OpenToRemote) should be an enum
  openToRemoteMulti: z.array(z.string()), // TODO: Remove optional  // z.array(OpenToRemote) should be an enum
  desiredSalary: z.string().max(255).nullable(),
  interestCauses: z.array(z.string().max(255)), // order matters
  otherCauses: z.array(z.string().max(255)).nullable(),
  workAuthorization: z.string().nullable(), // WorkAuthorization should be an enum
  interestGovt: z.boolean(),
  interestGovtEmplTypes: z.array(z.string()), // InterestGovtEmplTypes should be an enum
  previousImpactExperience: z.boolean(),
  essayResponse: z.string().max(5000),
  referenceAttribution: z.string().nullable(),
  referenceAttributionOther: z.string().nullable(),
});

const ApplicantDraftSubmissionRequestBodySchema =
  ApplicantCreateSubmissionRequestBodySchema.partial();

const ApplicantDraftSubmissionResponseBodySchema = z.object({
  submission: ApplicantCreateSubmissionResponseBodySchema.partial(),
  isFinal: z.boolean(),
});

export {
  ApplicantRequestBodySchema,
  ApplicantResponseBodySchema,
  ApplicantCreateSubmissionRequestBodySchema,
  ApplicantCreateSubmissionResponseBodySchema,
  ApplicantDraftSubmissionRequestBodySchema,
  ApplicantStateRequestBodySchema,
  ApplicantDraftSubmissionResponseBodySchema,
  ApplicantUpdateRequestBodySchema,
};
