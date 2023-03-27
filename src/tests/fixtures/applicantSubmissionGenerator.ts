import { ApplicantSubmissionBody } from '@App/resources/types/applicants.js';

/**
 * Get API request body for a new applicant submission.
 * @param options
 * @returns
 */
const getAPIRequestBody = (
  overrides: Partial<ApplicantSubmissionBody> = {},
): ApplicantSubmissionBody => ({
  originTag: '',
  lastRole: '',
  lastOrg: '',
  yoe: '',
  skills: ['react', 'python'], // enum
  otherSkills: ['juggling', 'curling'],
  linkedInUrl: 'https://www.linkedin.com/in/bob-bobberson',
  githubUrl: 'https://github.com/bboberson',
  portfolioUrl: null,
  portfolioPassword: '',
  resumeUrl: '',
  resumePassword: '',
  hoursPerWeek: '',
  interestEmploymentType: ['full'], // test this works
  interestRoles: [
    'software engineer - frontend',
    'software engineer - backend',
  ], // keep this as non-zod-enum?
  currentLocation: 'Boston, MA',
  openToRelocate: 'not sure',
  openToRemote: 'both',
  desiredSalary: '100,000',
  interestCauses: ['climate change', 'responsible AI'],
  otherCauses: 'animal rights', // keep this as non-zod-enum? order matters - refine to be length 2?
  workAuthorization: 'sponsorship',
  interestGovt: true,
  previousImpactExperience: false,
  essayResponse:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non iaculis erat.',
  referenceAttribution: 'social media',
  ...overrides,
});

const applicantSubmissionGenerator = {
  getAPIRequestBody,
};

export default applicantSubmissionGenerator;
