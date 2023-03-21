import request from 'supertest';
import app from '@App/app.js';
import prisma from '@App/resources/client.js';

afterEach(async () => {
  await prisma.opportunitySubmission.deleteMany();
  await prisma.opportunityBatch.deleteMany();
});

describe('POST /opportunities', () => {
  const oppSubmissionsPayload = {
    organization: {
      name: 'Bobs Burgers Foundation',
      type: 'nonprofit',
      size: '<50',
      impactAreas: ['Clean Energy'],
    },
    contact: {
      name: 'Bob Boberson',
      email: 'bboberson@gmail.com',
      phone: '4258287733',
    },
    submissions: [
      {
        fullTime: true,
        location: 'Burgerville',
        paid: true,
        pitchEssay: 'Come flip burgers for Bob',
        source: 'Commercial',
        type: 'nonprofit',
      },
    ],
  };
  it('should create a new opportunity submission', async () => {
    const { body } = await request(app)
      .post('/opportunities/batch')
      .send(oppSubmissionsPayload)
      .expect(200);
    expect(body).toEqual(expect.objectContaining({ id: expect.any(Number) }));
  });
  it('should create multiple new opportunity submissions', async () => {
    const secondOppSubmissionPayload = { ...oppSubmissionsPayload };
    secondOppSubmissionPayload.submissions.push({
      fullTime: false,
      location: 'Fryville',
      paid: true,
      pitchEssay: 'Come make french fries for Bob',
      source: 'Advertisement',
      type: 'nonprofit',
    });
    const { body } = await request(app)
      .post('/opportunities/batch')
      .send(secondOppSubmissionPayload)
      .expect(200);
    expect(body).toEqual(expect.objectContaining({ id: expect.any(Number) }));
  });
  it('should throw 400 error if request body is missing organization type', async () => {
    const missingOrgType = { ...oppSubmissionsPayload };
    // @ts-expect-error: Ignore TS error for invalid request body
    delete { ...oppSubmissionsPayload }.organization.type;
    const { body } = await request(app)
      .post('/opportunities/batch')
      .send([missingOrgType])
      .expect(400);
    expect(body).toHaveProperty('title', 'Validation Error');
  });
  test('Should throw error if request body has invalid org size', async () => {
    const invalidOrgSize = {
      ...oppSubmissionsPayload,
      organization: { ...oppSubmissionsPayload.organization, size: '100' },
    };
    const { body } = await request(app)
      .post('/opportunities/batch')
      .send([invalidOrgSize])
      .expect(400);
    expect(body).toHaveProperty('title', 'Validation Error');
  });
});
