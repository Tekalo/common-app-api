import request from 'supertest';
import { prisma } from '@App/resources/client.js';
import { OpportunityBatchResponseBody } from '@App/resources/types/opportunities.js';
import { OpportunityBatch } from '@prisma/client';
import opportunitySubmissionGenerator from '../fixtures/OpportunitySubmissionGenerator.js';
import getDummyApp from '../fixtures/appGenerator.js';
import { getRandomString } from '../util/helpers.js';
import authHelper, { TokenOptions } from '../util/auth.js';

const dummyApp = getDummyApp();
const { oppBatchPayload } = opportunitySubmissionGenerator;

afterEach(async () => {
  await prisma.opportunitySubmission.deleteMany();
  await prisma.opportunityBatch.deleteMany();
});

describe('DELETE /opportunities/batch/:id', () => {
  it('should return a 401 status code and NOT allow a user without an admin JWT to delete opportunity batch information', async () => {
    await request(dummyApp).delete('/opportunities/batch/1').expect(401);
  });

  it('should return a 200 status code and allow a user with an admin JWT to delete opportunity batch information', async () => {
    const randomString = getRandomString();
    const partialTokenOptions: TokenOptions = {
      roles: ['admin'],
    };
    const token = await authHelper.getToken(
      `bboberson${randomString}@gmail.com`,
      partialTokenOptions,
    );

    const { body: body1 }: { body: OpportunityBatchResponseBody } =
      await request(dummyApp)
        .post('/opportunities/batch')
        .send(oppBatchPayload)
        .expect(200);
    await request(dummyApp)
      .delete(`/opportunities/batch/${body1.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });
});

describe('POST /opportunities', () => {
  it('should create a new batch of opportunities', async () => {
    const { body } = await request(dummyApp)
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
      eoe: true,
      impactAreas: ['Clean Energy', 'Education'],
      impactAreasOther: ['Feeding the Community', 'Space for Socializing'],
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
      roleType: 'other',
      otherRoleType: 'Just a temp',
      positionTitle: 'French Guy',
      location: 'Fryville',
      paid: true,
      pitchEssay: 'Come make french fries for Bob',
      source: 'Advertisement',
      employmentType: 'a gig to get you through grad school',
      salaryRange: '20-30$/hr',
      desiredHoursPerWeek: '30',
      desiredStartDate: new Date('2023-12-01'),
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
    const { body } = await request(dummyApp)
      .post('/opportunities/batch')
      .send(secondOppSubmissionPayload)
      .expect(200);
    expect(body).toEqual(expect.objectContaining({ id: expect.any(Number) }));
  });
  it('should save UTM parameters', async () => {
    const { body }: { body: OpportunityBatch } = await request(dummyApp)
      .post('/opportunities/batch')
      .send({
        ...oppBatchPayload,
        utmParams: { ga_session_id: 'foo', ga_client_id: 'bar' },
      })
      .expect(200);
    const batch = await prisma.opportunityBatch.findUnique({
      where: { id: body.id },
      include: { utmParams: true },
    });
    expect(batch?.utmParams).toHaveProperty('params', {
      ga_session_id: 'foo',
      ga_client_id: 'bar',
    });
  });
  it('should throw 400 error if acceptedPrivacy is false', async () => {
    const falseAcceptedPrivacy = { ...oppBatchPayload };
    falseAcceptedPrivacy.acceptedPrivacy = false;
    const { body } = await request(dummyApp)
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
    const { body } = await request(dummyApp)
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
    const { body } = await request(dummyApp)
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
    const { body } = await request(dummyApp)
      .post('/opportunities/batch')
      .send(uppercasedEmail)
      .expect(200);
    expect(body).toEqual(
      expect.objectContaining({ contactEmail: email.toLowerCase() }),
    );
  });
  it('should throw 400 error if request body is missing organization type', async () => {
    const missingOrgType = { ...oppBatchPayload };
    // @ts-expect-error: Ignore TS error for invalid request body
    delete { ...missingOrgType }.organization.type;
    const { body } = await request(dummyApp)
      .post('/opportunities/batch')
      .send([missingOrgType])
      .expect(400);
    expect(body).toHaveProperty('title', 'Validation Error');
  });
});
