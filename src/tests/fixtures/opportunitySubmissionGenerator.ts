import { prisma } from '@App/resources/client.js';
import {
  OpportunityBatchResponseBody,
  OpportunitySubmission,
} from '@App/resources/types/opportunities.js';

/**
 * Generate opportunity batch payload for a new opportunity submission.
 * @param options
 * @returns
 */
const submissions: Array<OpportunitySubmission> = [
  {
    fullyRemote: false,
    roleType: 'software engineer - backend',
    positionTitle: 'Flipper 1',
    location: 'Burgerville',
    paid: true,
    pitchEssay: 'Come flip burgers for Bob',
    source: 'Commercial',
    employmentType: 'full-time employee',
    salaryRange: '20-30$/hr',
    desiredHoursPerWeek: '40',
    desiredStartDate: new Date('2023-12-01'),
    desiredYoe: ['0-2', '3-5', '6-8', '9-12'],
    desiredSkills: ['react', 'sketch'],
    desiredOtherSkills: ['flipping burgers', 'flipping houses'],
    visaSponsorship: 'no',
    similarStaffed: true,
    desiredImpactExp:
      'We would love to find someone who has non-profit fast food experience.',
  },
];
const oppBatchPayload = {
  acceptedPrivacy: true,
  referenceAttribution: 'other',
  referenceAttributionOther: 'reddit',
  organization: {
    name: 'Bobs Burgers Foundation',
    type: '501(c)(3)',
    size: '<20',
    impactAreas: ['Clean Energy', 'Education'],
    impactAreasOther: ['Feeding the Community', 'Space for Socializing'],
    eoe: true,
  },
  contact: {
    name: 'Bob Boberson',
    email: 'bboberson@gmail.com',
    phone: '+918-867-5309',
  },
  submissions,
};

const seedOpportunityBatch = async (
  email: string,
): Promise<OpportunityBatchResponseBody> => {
  const batch = await prisma.opportunityBatch.create({
    data: {
      orgName: "Bob's Business",
      orgType: 'Burgering',
      orgSize: '5',
      impactAreas: ['burgers, food'],
      contactName: 'bob',
      contactEmail: email,
      equalOpportunityEmployer: true,
      opportunitySubmissions: {
        createMany: {
          data: [
            {
              source: 'nada',
              employmentType: 'just do it',
              paid: true,
              roleType: 'flippin burgers',
              positionTitle: 'burger flipper',
              fullyRemote: false,
              pitchEssay: "you'll be flippin burgers",
            },
          ],
        },
      },
    },
  });
  const returnBatch: OpportunityBatchResponseBody = {
    eoe: batch.equalOpportunityEmployer,
    ...batch,
  };
  return returnBatch;
};

export { oppBatchPayload, seedOpportunityBatch };
