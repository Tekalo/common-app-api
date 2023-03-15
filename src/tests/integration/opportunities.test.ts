import request from 'supertest';
import app from '@App/app.js';
import prisma from '@App/resources/client.js';

afterEach(async () => {
  await prisma.opportunitySubmission.deleteMany();
});

describe('POST /applicants', () => {
  const oppSubmissionsPayload = {
    organization: {
      name: 'Bobs Burgers Foundation',
      type: 'nonprofit',
      size: '<50',
    },
    contact: {
      name: 'Bob Boberson',
      email: 'bboberson@gmail.com',
      phone: '4258287733',
    },
    fullTime: false,
  };
  it('should create a new opportunity submission', async () => {
    const { body } = await request(app)
      .post('/opportunities/submissions')
      .send([oppSubmissionsPayload])
      .expect(200);
    expect(body).toEqual({ count: 1 });
  });
  it('should create multiple new opportunity submissions', async () => {
    const secondOppSubmissionPayload = { ...oppSubmissionsPayload };
    secondOppSubmissionPayload.organization = {
      name: 'Ronald McDonald House',
      type: 'government',
      size: '<50',
    };
    const { body } = await request(app)
      .post('/opportunities/submissions')
      .send([oppSubmissionsPayload, secondOppSubmissionPayload])
      .expect(200);
    expect(body).toHaveProperty('count', 2);
  });
  it('should throw 400 error if request body is missing fullTime flag', async () => {
    const missingOrgType = { ...oppSubmissionsPayload };
    // @ts-expect-error: Ignore TS error for invalid request body
    delete { ...oppSubmissionsPayload }.organization.type;
    const { body } = await request(app)
      .post('/opportunities/submissions')
      .send([missingOrgType])
      .expect(400);
    expect(body).toHaveProperty('title', 'Validation Error');
  });
  test('Should throw error if request body has invalid org size', async () => {
    const invalidOrgSize = { orgSize: '100', ...oppSubmissionsPayload };
    const { body } = await request(app)
      .post('/opportunities/submissions')
      .send([invalidOrgSize])
      .expect(400);
    expect(body).toHaveProperty('title', 'Validation Error');
  });
});
