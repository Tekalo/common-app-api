import request from 'supertest';
import getApp from '@App/app.js';
import prisma from '@App/resources/client.js';
import DummyAuthService from '../fixtures/DummyAuthService.js';
import DummyMonitoringService from '../fixtures/DummyMonitoringService.js';

const app = getApp(new DummyAuthService(), new DummyMonitoringService());

afterEach(async () => {
  await prisma.opportunitySubmission.deleteMany();
  await prisma.opportunityBatch.deleteMany();
});

describe('POST /opportunities', () => {
  const oppBatchPayload = {
    organization: {
      name: 'Bobs Burgers Foundation',
      type: '501c(3)',
      size: '<20',
      impactAreas: ['Clean Energy'],
      eoe: true,
    },
    contact: {
      name: 'Bob Boberson',
      email: 'bboberson@gmail.com',
      phone: '4258287733',
    },
    submissions: [
      {
        fullyRemote: false,
        roleType: 'Flipper',
        positionTitle: 'Flipper 1',
        location: 'Burgerville',
        paid: true,
        pitchEssay: 'Come flip burgers for Bob',
        source: 'Commercial',
        employmentType: 'full-time job',
        salaryRange: '20-30$/hr',
        desiredHoursPerWeek: '40',
        desiredStartDate: '2023-01-01',
        desiredYoe: ['0-2', '2-4'],
        desiredSkills: ['react', 'sketch'],
        desiredOtherSkills: 'really good at flipping burgers',
        visaSponsorship: 'no',
        similarStaffed: true,
        desiredImpactExp:
          'We would love to find someone who has non-profit fast food experience.',
      },
    ],
  };
  it('should create a new batch of opportunities', async () => {
    const { body } = await request(app)
      .post('/opportunities/batch')
      .send(oppBatchPayload)
      .expect(200);
    expect(body).toEqual(expect.objectContaining({ id: expect.any(Number) }));
  });
  it('should create multiple new batches of opportunities', async () => {
    const secondOppSubmissionPayload = { ...oppBatchPayload };
    secondOppSubmissionPayload.submissions.push({
      fullyRemote: false,
      roleType: 'Frencher',
      positionTitle: 'French Guy',
      location: 'Fryville',
      paid: true,
      pitchEssay: 'Come make french fries for Bob',
      source: 'Advertisement',
      employmentType: 'full-time job',
      salaryRange: '20-30$/hr',
      desiredHoursPerWeek: '30',
      desiredStartDate: '2023-12-01',
      desiredYoe: ['15+'],
      desiredSkills: ['figma', 'project management'],
      desiredOtherSkills:
        'really good at frying fries, specifically of the waffle persuasion',
      visaSponsorship: 'no',
      similarStaffed: false,
      desiredImpactExp:
        'A candidate who has experience frying fries in the non-profit space',
    });
    const { body } = await request(app)
      .post('/opportunities/batch')
      .send(secondOppSubmissionPayload)
      .expect(200);
    expect(body).toEqual(expect.objectContaining({ id: expect.any(Number) }));
  });
  it('should throw 400 error if request body is missing organization type', async () => {
    const missingOrgType = { ...oppBatchPayload };
    // @ts-expect-error: Ignore TS error for invalid request body
    delete { ...oppBatchPayload }.organization.type;
    const { body } = await request(app)
      .post('/opportunities/batch')
      .send([missingOrgType])
      .expect(400);
    expect(body).toHaveProperty('title', 'Validation Error');
  });
  test('Should throw error if request body has invalid org size', async () => {
    const invalidOrgSize = {
      ...oppBatchPayload,
      organization: { ...oppBatchPayload.organization, size: '100' },
    };
    const { body } = await request(app)
      .post('/opportunities/batch')
      .send([invalidOrgSize])
      .expect(400);
    expect(body).toHaveProperty('title', 'Validation Error');
  });
});
