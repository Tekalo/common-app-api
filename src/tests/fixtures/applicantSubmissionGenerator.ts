import { prisma } from '@App/resources/client.js';
import {
  ApplicantResponseBody,
  RawApplicantSubmissionBody,
} from '@App/resources/types/applicants.js';
import { Upload } from '@prisma/client';

/**
 * Get API request body for a new applicant submission.
 * @param options
 * @returns
 */
const getAPIRequestBody = (
  resumeId: number,
  overrides?: Partial<RawApplicantSubmissionBody>,
): RawApplicantSubmissionBody => ({
  originTag: '',
  lastRole: 'senior software engineer',
  lastOrg: 'mozilla',
  yoe: '>11',
  skills: ['react', 'python'], // enum
  otherSkills: ['juggling', 'curling'],
  linkedInUrl: 'https://www.linkedin.com/in/bob-bobberson',
  githubUrl: 'https://github.com/bboberson',
  portfolioUrl: 'https://bobsportfolio.com',
  portfolioPassword: 'bobsTheWord',
  resumeUpload: { id: resumeId },
  hoursPerWeek: '40 ish',
  interestEmploymentType: ['full'], // enum
  interestWorkArrangement: null,
  interestRoles: [
    'software engineer - frontend',
    'software engineer - backend',
  ],
  currentLocation: 'Boston, MA',
  openToRelocate: 'not sure',
  openToRemoteMulti: ['in-person', 'hybrid'],
  desiredSalary: '100,000',
  interestCauses: ['climate change', 'responsible AI'],
  otherCauses: ['animal rights'],
  workAuthorization: 'sponsorship',
  interestGovt: true,
  interestGovtEmplTypes: ['paid'],
  previousImpactExperience: false,
  essayResponse:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non iaculis erat.',
  referenceAttribution: 'other',
  referenceAttributionOther: 'my friend bob told me about Tekalo',
  ...overrides,
});

const seedResumeUpload = async (applicantId: number): Promise<Upload> =>
  prisma.upload.create({
    data: {
      type: 'RESUME',
      status: 'SUCCESS',
      applicantId,
      originalFilename: 'myresume.pdf',
      contentType: 'application/pdf',
    },
  });

const seedApplicantWithIDs = async (
  email: string,
  auth0Id: string,
  applicantId?: number,
): Promise<ApplicantResponseBody> => {
  const applicant = await prisma.applicant.create({
    data: {
      id: applicantId,
      name: 'Bob Boberson',
      auth0Id,
      pronoun: 'he/his',
      phone: '123-456-7899',
      email,
      preferredContact: 'email',
      searchStatus: 'active',
      acceptedTerms: new Date(Date.now()),
      acceptedPrivacy: new Date(Date.now()),
    },
  });
  return {
    id: applicant.id,
    auth0Id: applicant.auth0Id,
    email: applicant.email,
  };
};

const seedApplicant = async (
  emailSuffix?: string,
): Promise<ApplicantResponseBody> =>
  seedApplicantWithIDs(`bboberson${emailSuffix}@gmail.com`, 'auth0|123456');

export {
  getAPIRequestBody,
  seedResumeUpload,
  seedApplicant,
  seedApplicantWithIDs,
};
