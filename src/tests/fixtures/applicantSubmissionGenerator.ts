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
  lastRole: 'senior software engineer',
  lastOrg: 'mozilla',
  yoe: '>11',
  skills: ['react', 'python'], // enum
  otherSkills: ['juggling', 'curling'],
  linkedInUrl: 'https://www.linkedin.com/in/bob-bobberson',
  githubUrl: 'https://github.com/bboberson',
  portfolioUrl: null,
  portfolioPassword: '',
  resumeUrl: 'myportfolio.com',
  resumePassword: null,
  hoursPerWeek: null,
  interestEmploymentType: ['full'], // enum
  interestRoles: [
    'software engineer - frontend',
    'software engineer - backend',
  ],
  currentLocation: 'Boston, MA',
  openToRelocate: 'not sure',
  openToRemote: 'both',
  desiredSalary: '100,000',
  interestCauses: ['climate change', 'responsible AI'],
  otherCauses: ['animal rights'],
  workAuthorization: 'sponsorship',
  interestGovt: true,
  interestGovtEmplTypes: ['paid'],
  previousImpactExperience: false,
  essayResponse:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non iaculis erat.',
  referenceAttribution: 'social media', // enum
  ...overrides,
});

const applicantSubmissionGenerator = {
  getAPIRequestBody,
};

export default applicantSubmissionGenerator;
