import { z } from 'zod';
import Shared from './shared.js';

const PreferredContact = z.enum(['sms', 'whatsapp', 'email']);
const SearchStatus = z.enum(['active', 'passive', 'future']);
const InterestGovtEmplTypes = z.enum(['paid', 'unpaid']);
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

const ApplicantCreateRequestBodySchema = z.object({
  name: z.string().max(255),
  email: z.string().email().toLowerCase(),
  phone: z.string().optional(),
  pronoun: z.string().max(255).optional(),
  preferredContact: PreferredContact,
  searchStatus: SearchStatus,
  acceptedTerms: z.literal(true),
  acceptedPrivacy: z.literal(true),
  followUpOptIn: z.boolean().optional(),
  utmParams: Shared.UTMPayloadSchema.nullish(),
});

const ApplicantGetResponseBodySchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  isPaused: z.boolean(),
});

const ApplicantStateRequestBodySchema = z.object({
  pause: z.boolean(),
});

const ApplicantStateResponseBodySchema = z.object({
  id: z.number(),
  isPaused: z.boolean(),
});

const ApplicantUpdateRequestBodySchema = z.object({
  auth0Id: z.string(),
});

const ApplicantCreateResponseBodySchema = z.object({
  id: z.number(),
  auth0Id: z.string().nullable(),
  email: z.string(),
});

/**
 * All optional fields AKA fields that are always present on the submission form, but do not have to be filled out, should be nullable()
 * All conditional fields AKA fields that may not always appear on the submission form, should be nullish()
 */
const ApplicantCreateSubmissionRequestBody = z.object({
  originTag: z.string(),
  lastRole: z.string().max(255),
  resumeUpload: z.object({
    id: z.number(),
  }),
  lastOrg: z.string().max(255),
  yoe: YOE,
  skills: z.array(z.string().max(255)).transform((skillsArray) =>
    skillsArray.map((skill) =>
      skill
        .trim()
        .split(/[\s,\t]+/)
        .join(' '),
    ),
  ),
  otherSkills: z.array(z.string().max(255)),
  linkedInUrl: z.string().max(500).nullable(),
  githubUrl: z.string().max(500).nullable(),
  portfolioUrl: z.string().max(500).nullable(),
  portfolioPassword: z.string().max(255).nullable(),
  hoursPerWeek: z.string().max(255).nullable(),
  interestEmploymentType: z.array(EmploymentType),
  // Conditional field: interestWorkArrangement can be undefined if interestEmploymentType is 'full'
  interestWorkArrangement: z
    .array(z.string())
    .nullish()
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
  utmParams: Shared.UTMPayloadSchema.nullish(),
  referenceAttribution: z.string().nullable(),
  // Conditional field: referenceAttributionOther can be undefined if referenceAttribution is not 'Other'
  referenceAttributionOther: z.string().nullish().default(null),
});

type SubmissionType = z.input<typeof ApplicantCreateSubmissionRequestBody>;

/**
 * Any additional validation logic that should be applied to the final submission schema
 * @param submission
 * @returns {boolean} true if validation passes, false if not
 */
const submissionRefinement = (submission: SubmissionType) => {
  // interestWorkArrangement cannot be null/undefined if interestEmploymentType is 'part'
  if (submission.interestEmploymentType.includes('part')) {
    return submission.interestWorkArrangement?.length;
  }
  return true;
};

const ApplicantCreateSubmissionRequestBodySchema =
  ApplicantCreateSubmissionRequestBody.refine(submissionRefinement, {
    message: 'interestWorkArrangement must be defined or set to null',
    path: ['interestWorkArrangement'],
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
    .array(z.string().max(255))
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
  utmParams: Shared.UTMPayloadSchema.nullish(),
  referenceAttribution: z.string().nullish(),
  referenceAttributionOther: z.string().nullish(),
});

const ApplicantUpdateSubmissionRequestBodySchema =
  ApplicantCreateSubmissionRequestBody.omit({ utmParams: true }).refine(
    submissionRefinement,
    {
      message: 'interestWorkArrangement must be defined or set to null',
      path: ['interestWorkArrangement'],
    },
  );

const ApplicantDraftSubmissionResponseBodySchema = z.object({
  submission: ApplicantSubmissionResponseBody,
  isFinal: z.boolean(),
});

// Draft or final submission
const ApplicantGetSubmissionsResponseBodySchema = z.object({
  submission: ApplicantSubmissionResponseBody.or(
    ApplicantDraftSubmissionResponseBodySchema.shape.submission,
  ).nullable(),
  isFinal: z.boolean(),
});

export default {
  ApplicantCreateRequestBodySchema,
  ApplicantCreateResponseBodySchema,
  ApplicantGetResponseBodySchema,
  ApplicantCreateSubmissionRequestBodySchema,
  ApplicantCreateSubmissionResponseBodySchema,
  ApplicantDraftSubmissionRequestBodySchema,
  ApplicantStateRequestBodySchema,
  ApplicantStateResponseBodySchema,
  ApplicantDraftSubmissionResponseBodySchema,
  ApplicantUpdateRequestBodySchema,
  ApplicantGetSubmissionsResponseBodySchema,
  ApplicantUpdateSubmissionRequestBodySchema,
};
