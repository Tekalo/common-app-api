import request from 'supertest';
import getApp from '@App/app.js';
import prisma from '@App/resources/client.js';
import configLoader from '@App/services/configLoader.js';
import DummyAuthService from '../fixtures/DummyAuthService.js';
import DummyMonitoringService from '../fixtures/DummyMonitoringService.js';
import DummyEmailService from '../fixtures/DummyEmailService.js';
import DummySESService from '../fixtures/DummySesService.js';

const appConfig = configLoader.loadConfig();
const app = getApp(
  new DummyAuthService(),
  new DummyMonitoringService(),
  new DummyEmailService(new DummySESService(), appConfig),
  appConfig,
);

afterEach(async () => {
  await prisma.opportunitySubmission.deleteMany();
  await prisma.opportunityBatch.deleteMany();
});
describe('POST /opportunities', () => {
  const oppBatchPayload = {
    acceptedPrivacy: true,
    referenceAttribution: 'other',
    referenceAttributionOther: 'reddit',
    organization: {
      name: 'Bobs Burgers Foundation',
      type: '501(c)(3)',
      size: '<20',
      impactAreas: ['Clean Energy', 'Education'],
      eoe: true,
    },
    contact: {
      name: 'Bob Boberson',
      email: 'bboberson@gmail.com',
      phone: '+918-867-5309',
    },
    submissions: [
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
        desiredStartDate: '2023-01-01',
        desiredYoe: ['0-2', '2-4'],
        desiredSkills: ['react', 'sketch'],
        desiredOtherSkills: ['flipping burgers', 'flipping houses'],
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
    expect(body).toEqual({
      id: expect.any(Number),
      acceptedPrivacy: expect.any(String),
      contactEmail: 'bboberson@gmail.com',
      contactName: 'Bob Boberson',
      contactPhone: '+918-867-5309',
      equalOpportunityEmployer: true,
      impactAreas: ['Clean Energy', 'Education'],
      orgName: 'Bobs Burgers Foundation',
      orgSize: '<20',
      orgType: '501(c)(3)',
      referenceAttribution: 'other',
      referenceAttributionOther: 'reddit',
    });
  });
  it('should create multiple new batches of opportunities', async () => {
    const secondOppSubmissionPayload = { ...oppBatchPayload };
    secondOppSubmissionPayload.submissions.push({
      fullyRemote: false,
      roleType: 'ux researcher',
      positionTitle: 'French Guy',
      location: 'Fryville',
      paid: true,
      pitchEssay: 'Come make french fries for Bob',
      source: 'Advertisement',
      employmentType: 'a gig to get you through grad school',
      salaryRange: '20-30$/hr',
      desiredHoursPerWeek: '30',
      desiredStartDate: '2023-12-01',
      desiredYoe: ['15+'],
      desiredSkills: ['figma', 'project management'],
      desiredOtherSkills: [
        'really good at frying fries',
        'waffle fry manufacturing',
      ],
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
  it('should throw 400 error if acceptedPrivacy is false', async () => {
    const falseAcceptedPrivacy = { ...oppBatchPayload };
    falseAcceptedPrivacy.acceptedPrivacy = false;
    const { body } = await request(app)
      .post('/opportunities/batch')
      .send([falseAcceptedPrivacy])
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
  test('Should throw error if request body has invalid email', async () => {
    const invalidEmail = {
      ...oppBatchPayload,
      organization: {
        ...oppBatchPayload.contact,
        email: 'bobbobersonhasnoemail',
      },
    };
    const { body } = await request(app)
      .post('/opportunities/batch')
      .send([invalidEmail])
      .expect(400);
    expect(body).toHaveProperty('title', 'Validation Error');
  });
  test('Should convert email to lower case before saving in the database', async () => {
    const email = 'BBoberson@gmail.com';
    const uppercasedEmail = {
      ...oppBatchPayload,
      contact: {
        ...oppBatchPayload.contact,
        email,
      },
    };
    const { body } = await request(app)
      .post('/opportunities/batch')
      .send(uppercasedEmail)
      .expect(200);
    expect(body).toEqual(
      expect.objectContaining({ contactEmail: email.toLowerCase() }),
    );
  });
  // this test mutates oppBatchPayload by removing an element, so we should run it last
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
});

describe('DELETE /opportunities/batch/:id', () => {
  it('should return 401 without valid JWT', async () => {
    await request(app).delete('/opportunities/batch/1').expect(401);
  });
});
