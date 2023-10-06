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
  resumeUpload: z.object({
    id: z.number(),
  }),
  lastOrg: z.string().max(255),
  yoe: YOE,
  skills: z.array(Skills),
  otherSkills: z.array(z.string().max(255)),
  linkedInUrl: z.string().max(500).nullable(),
  githubUrl: z.string().max(500).nullable(),
  portfolioUrl: z.string().max(500).nullable(),
  portfolioPassword: z.string().max(255).nullable(),
  resumeUrl: z.string().max(500).nullable(), // deprecated
  resumePassword: z.string().max(255).nullable(),
  hoursPerWeek: z.string().max(255).nullable(),
  interestEmploymentType: z.array(EmploymentType),
  interestWorkArrangement: z
    .array(z.string())
    .nullable()
    .transform((val) => val || []),
  interestRoles: z.array(z.string().max(255)),
  currentLocation: z.string().max(255),
  openToRelocate: OpenToRelocate,
  openToRemoteMulti: z.array(OpenToRemote),
  desiredSalary: z.string().max(255).nullable(),
  interestCauses: z.array(z.string().max(255)), // order matters
  otherCauses: z
    .array(z.string().max(255))
    .nullable()
    .transform((val) => val || []),
  workAuthorization: WorkAuthorization.nullable(),
  interestGovt: z.boolean(),
  interestGovtEmplTypes: z
    .array(InterestGovtEmplTypes)
    .nullable()
    .transform((val) => val || []),
  previousImpactExperience: z.boolean(),
  essayResponse: z.string().max(5000),
  referenceAttribution: z.string().nullable(),
  referenceAttributionOther: z.string().nullable(),
});

const ApplicantSubmissionResponseBody = z.object({
  id: z.number(),
  applicantId: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
  originTag: z.string().nullable(),
  lastRole: z.string().max(255).nullable(),
  lastOrg: z.string().max(255).nullable(),
  yoe: z.string().nullable(),
  skills: z.array(z.string()).nullable(),
  otherSkills: z.array(z.string().max(255)).nullable(),
  linkedInUrl: z.string().max(500).nullable(),
  githubUrl: z.string().max(500).nullable(),
  portfolioUrl: z.string().max(500).nullable(),
  portfolioPassword: z.string().max(255).nullable(),
  resumeUpload: z
    .object({
      id: z.number(),
      originalFilename: z.string(),
    })
    .nullable(),
  resumeUrl: z.string().max(500).nullable(), // deprecated
  resumePassword: z.string().max(255).nullable(),
  hoursPerWeek: z.string().max(255).nullable(),
  interestEmploymentType: z.array(z.string()).nullable(),
  interestWorkArrangement: z.array(z.string()).nullable(),
  interestRoles: z.array(z.string().max(255)).nullable(),
  currentLocation: z.string().max(255).nullable(),
  openToRelocate: z.string().nullable(),
  openToRemoteMulti: z.array(z.string()).nullable(),
  desiredSalary: z.string().max(255).nullable(),
  interestCauses: z.array(z.string().max(255)).nullable(),
  otherCauses: z.array(z.string().max(255)).nullable(),
  workAuthorization: z.string().nullable(),
  interestGovt: z.boolean().nullable(),
  interestGovtEmplTypes: z.array(z.string()).nullable(),
  previousImpactExperience: z.boolean().nullable(),
  essayResponse: z.string().max(5000).nullable(),
  referenceAttribution: z.string().nullable(),
  referenceAttributionOther: z.string().nullable(),
});

const ApplicantCreateSubmissionResponseBodySchema = z.object({
  submission: ApplicantSubmissionResponseBody,
  isFinal: z.boolean(),
});

const ApplicantGetSubmissionsResponseBodySchema = z.object({
  submission: ApplicantSubmissionResponseBody.nullable(),
  isFinal: z.boolean(),
});

const ApplicantDraftSubmissionRequestBodySchema = z.object({
  originTag: z.string().nullish(),
  lastRole: z.string().max(255).nullish(),
  resumeUpload: z
    .object({
      id: z.number(),
    })
    .nullish(),
  lastOrg: z.string().max(255).nullish(),
  yoe: YOE.nullish(),
  skills: z
    .array(Skills)
    .nullish()
    .transform((val) => val || []),
  otherSkills: z
    .array(z.string().max(255))
    .nullish()
    .transform((val) => val || []),
  linkedInUrl: z.string().max(500).nullish(),
  githubUrl: z.string().max(500).nullish(),
  portfolioUrl: z.string().max(500).nullish(),
  portfolioPassword: z.string().max(255).nullish(),
  resumeUrl: z.string().max(500).nullish(), // deprecated
  resumePassword: z.string().max(255).nullish(),
  hoursPerWeek: z.string().max(255).nullish(),
  interestEmploymentType: z
    .array(EmploymentType)
    .nullish()
    .transform((val) => val || []),
  interestWorkArrangement: z
    .array(z.string())
    .nullish()
    .transform((val) => val || []),
  interestRoles: z
    .array(z.string().max(255))
    .nullish()
    .transform((val) => val || []),
  currentLocation: z.string().max(255).nullish(),
  openToRelocate: OpenToRelocate.nullish(),
  openToRemoteMulti: z
    .array(OpenToRemote)
    .nullish()
    .transform((val) => val || []),
  desiredSalary: z.string().max(255).nullish(),
  interestCauses: z
    .array(z.string().max(255))
    .nullish()
    .transform((val) => val || []), // order matters
  otherCauses: z
    .array(z.string().max(255))
    .nullish()
    .transform((val) => val || []),
  workAuthorization: WorkAuthorization.nullish(),
  interestGovt: z.boolean().nullish(),
  interestGovtEmplTypes: z
    .array(InterestGovtEmplTypes)
    .nullish()
    .transform((val) => val || []),
  previousImpactExperience: z.boolean().nullish(),
  essayResponse: z.string().max(5000).nullish(),
  referenceAttribution: z.string().nullish(),
  referenceAttributionOther: z.string().nullish(),
});

const ApplicantUpdateSubmissionRequestBodySchema =
  ApplicantCreateSubmissionRequestBodySchema;

const ApplicantDraftSubmissionResponseBodySchema = z.object({
  submission: ApplicantSubmissionResponseBody,
  isFinal: z.boolean(),
});

export default {
  ApplicantRequestBodySchema,
  ApplicantResponseBodySchema,
  ApplicantCreateSubmissionRequestBodySchema,
  ApplicantCreateSubmissionResponseBodySchema,
  ApplicantDraftSubmissionRequestBodySchema,
  ApplicantStateRequestBodySchema,
  ApplicantDraftSubmissionResponseBodySchema,
  ApplicantUpdateRequestBodySchema,
  ApplicantGetSubmissionsResponseBodySchema,
  ApplicantUpdateSubmissionRequestBodySchema,
};
