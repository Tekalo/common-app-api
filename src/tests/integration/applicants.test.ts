import request from 'supertest';
import app from '@App/app.js';
import AuthService from '@App/services/AuthService.js';
import {
  ApplicantResponseBody,
  ApplicantSubmissionBody,
} from '@App/resources/types/applicants.js';
import itif from '@App/tests/util/helpers.js';
import prisma from '@App/resources/client.js';
import applicantSubmissionGenerator from '../fixtures/applicantSubmissionGenerator.js';

let testUserID: string;
const authService = new AuthService();

afterEach(async () => {
  if (testUserID) {
    const auth0Service = authService.getClient();
    await auth0Service.deleteUser({ id: testUserID });
  }
  await prisma.applicantSubmission.deleteMany();
  await prisma.applicant.deleteMany();
});

describe('POST /applicants', () => {
  it('should create a new applicant only in database', async () => {
    const { body } = await request(app)
      .post('/applicants')
      .send({
        name: 'Bob Boberson',
        email: 'bboberson@gmail.com',
        preferredContact: 'email',
        searchStatus: 'active',
        acceptedTerms: true,
        acceptedPrivacy: true,
      })
      .query('auth0=false')
      .expect(200);
    expect(body).toHaveProperty('id');
  });
  it('should throw 400 error for missing email', async () => {
    const { body } = await request(app)
      .post('/applicants')
      .send({ name: 'Bob Boberson' })
      .expect(400);
    expect(body).toHaveProperty('title', 'Validation Error');
  });
  it('should throw 400 error if acceptedPrivacy false', async () => {
    const { body } = await request(app)
      .post('/applicants')
      .send({
        name: 'Bob Boberson',
        email: 'bboberson@gmail.com',
        preferredContact: 'sms',
        searchStatus: 'active',
        acceptedTerms: true,
        acceptedPrivacy: false,
      })
      .expect(400);
    expect(body).toHaveProperty('title', 'Validation Error');
  });
  it('should throw 400 error when creating a duplicate applicant', async () => {
    await request(app).post('/applicants').query('auth0=false').send({
      name: 'Bob Boberson',
      email: 'bboberson@gmail.com',
      preferredContact: 'sms',
      searchStatus: 'active',
      acceptedTerms: true,
      acceptedPrivacy: true,
    });
    const { body } = await request(app)
      .post('/applicants')
      .query('auth0=false')
      .send({
        name: 'Bob Boberson',
        email: 'bboberson@gmail.com',
        preferredContact: 'sms',
        searchStatus: 'active',
        acceptedTerms: true,
        acceptedPrivacy: true,
      })
      .expect(400);
    expect(body).toHaveProperty('title', 'User Creation Error');
  });
  test('Should throw error if request body has invalid preferred contact', async () => {
    const { body } = await request(app)
      .post('/applicants')
      .send({
        name: 'Bob Boberson',
        email: 'bboberson@gmail.com',
        preferredContact: 'text me please',
        searchStatus: 'active',
        acceptedTerms: true,
        acceptedPrivacy: true,
      })
      .expect(400);
    expect(body).toHaveProperty('title', 'Validation Error');
  });

  describe('Auth0 Integration', () => {
    itif('CI' in process.env)(
      'should create a new applicant and store in Auth0',
      async () => {
        const { body }: { body: ApplicantResponseBody } = await request(app)
          .post('/applicants')
          .send({
            name: 'Bob Boberson',
            email: 'bboberson@gmail.com',
            preferredContact: 'sms',
            searchStatus: 'active',
            acceptedTerms: true,
            acceptedPrivacy: true,
          })
          .expect(200);
        if (body.auth0Id) {
          testUserID = body.auth0Id;
        }
        expect(body).toHaveProperty('auth0Id');
        expect(body).toHaveProperty('email');
      },
    );
    itif('CI' in process.env)(
      'should throw 409 if user already exists in Auth0',
      async () => {
        const { body }: { body: ApplicantResponseBody } = await request(app)
          .post('/applicants')
          .send({
            name: 'Bob Boberson',
            email: 'bboberson@gmail.com',
            preferredContact: 'sms',
            searchStatus: 'active',
            acceptedTerms: true,
            acceptedPrivacy: true,
          });
        if (body.auth0Id) {
          testUserID = body.auth0Id;
        }
        const { body: conflictBody } = await request(app)
          .post('/applicants')
          .send({
            name: 'Bob Boberson',
            email: 'bboberson@gmail.com',
            preferredContact: 'sms',
            searchStatus: 'active',
            acceptedTerms: true,
            acceptedPrivacy: true,
          })
          .expect(409);
        expect(conflictBody).toHaveProperty('title', 'User Creation Error');
        expect(conflictBody).toHaveProperty('detail', 'User already exists');
      },
    );
  });
});

describe('POST /applicants/:id/submissions', () => {
  it('should create a new applicant submission', async () => {
    const testApplicantResp = await request(app)
      .post('/applicants')
      .query('auth0=false')
      .send({
        name: 'Bob Boberson',
        email: 'bboberson@gmail.com',
        preferredContact: 'sms',
        searchStatus: 'active',
        acceptedTerms: true,
        acceptedPrivacy: true,
      });
    const { id }: { id: number } = testApplicantResp.body;
    const testBody: ApplicantSubmissionBody =
      applicantSubmissionGenerator.getAPIRequestBody();
    const { body } = await request(app)
      .post(`/applicants/${id}/submissions`)
      .send(testBody)
      .expect(200);
    expect(body).toHaveProperty('id');
  });

  it('should throw 400 error for missing years of experience (yoe)', async () => {
    const testSubmission = applicantSubmissionGenerator.getAPIRequestBody();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    delete testSubmission.yoe;
    const { body } = await request(app)
      .post('/applicants/1/submissions')
      .send({ ...testSubmission })
      .expect(400);
    expect(body).toHaveProperty('title', 'Validation Error');
  });

  it('should throw error if request body has invalid XXXX', async () => {
    const testSubmission = applicantSubmissionGenerator.getAPIRequestBody();
    const { body } = await request(app)
      .post('/applicants/1/submissions')
      .send({ ...testSubmission, openToRelocate: 'idk maybe' })
      .expect(400);
    expect(body).toHaveProperty('title', 'Validation Error');
  });
});
