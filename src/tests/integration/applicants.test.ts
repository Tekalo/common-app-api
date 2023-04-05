import request from 'supertest';
import getApp from '@App/app.js';
import {
  ApplicantDraftSubmissionBody,
  ApplicantResponseBody,
  ApplicantSubmissionBody,
} from '@App/resources/types/applicants.js';
import { itif, getRandomString } from '@App/tests/util/helpers.js';
import prisma from '@App/resources/client.js';
import AuthService from '@App/services/AuthService.js';

import applicantSubmissionGenerator from '../fixtures/applicantSubmissionGenerator.js';
import DummyAuthService from '../fixtures/DummyAuthService.js';

let testUserID: string;
const authService = new AuthService();

afterEach(async () => {
  await prisma.applicantDraftSubmission.deleteMany();
  await prisma.applicantSubmission.deleteMany();
  await prisma.applicant.deleteMany();
});

describe('POST /applicants', () => {
  describe('No Auth0', () => {
    const dummyAuthApp = getApp(new DummyAuthService());
    it('should create a new applicant only in database', async () => {
      const { body } = await request(dummyAuthApp)
        .post('/applicants')
        .send({
          name: 'Bob Boberson',
          pronoun: 'he/his',
          email: `bboberson${getRandomString()}@gmail.com`,
          preferredContact: 'email',
          searchStatus: 'active',
          acceptedTerms: true,
          acceptedPrivacy: true,
        })
        .expect(200);
      expect(body).toHaveProperty('id');
    });
    it('should throw 400 error for missing email', async () => {
      const { body } = await request(dummyAuthApp)
        .post('/applicants')
        .send({ name: 'Bob Boberson' })
        .expect(400);
      expect(body).toHaveProperty('title', 'Validation Error');
    });
    it('should throw 400 error if acceptedPrivacy false', async () => {
      const { body } = await request(dummyAuthApp)
        .post('/applicants')
        .send({
          name: 'Bob Boberson',
          email: `bboberson${getRandomString()}@gmail.com`,
          preferredContact: 'sms',
          searchStatus: 'active',
          acceptedTerms: true,
          acceptedPrivacy: false,
        })
        .expect(400);
      expect(body).toHaveProperty('title', 'Validation Error');
    });
    it('should throw 400 error when creating a duplicate applicant in database', async () => {
      await request(dummyAuthApp).post('/applicants').send({
        name: 'Bob Boberson',
        email: 'bboberson123@gmail.com',
        preferredContact: 'sms',
        searchStatus: 'active',
        acceptedTerms: true,
        acceptedPrivacy: true,
      });
      const { body } = await request(dummyAuthApp)
        .post('/applicants')
        .send({
          name: 'Bob Boberson',
          email: 'bboberson123@gmail.com',
          preferredContact: 'sms',
          searchStatus: 'active',
          acceptedTerms: true,
          acceptedPrivacy: true,
        })
        .expect(400);
      expect(body).toHaveProperty('title', 'User Creation Error');
    });
    test('Should throw error if request body has invalid preferred contact', async () => {
      const { body } = await request(dummyAuthApp)
        .post('/applicants')
        .send({
          name: 'Bob Boberson',
          email: `bboberson${getRandomString()}@gmail.com`,
          preferredContact: 'text me please',
          searchStatus: 'active',
          acceptedTerms: true,
          acceptedPrivacy: true,
        })
        .expect(400);
      expect(body).toHaveProperty('title', 'Validation Error');
    });
  });

  describe('Auth0 Integration', () => {
    const app = getApp(authService);
    afterEach(async () => {
      if (testUserID) {
        const auth0Service = authService.getClient();
        await auth0Service.deleteUser({ id: testUserID });
      }
    });
    itif('CI' in process.env)(
      'should create a new applicant and store in Auth0',
      async () => {
        const { body }: { body: ApplicantResponseBody } = await request(app)
          .post('/applicants')
          .send({
            name: 'Bob Boberson',
            email: `bboberson${getRandomString()}@gmail.com`,
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
            email: 'bboberson333@gmail.com',
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
            email: 'bboberson333@gmail.com',
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
  const dummyAuthApp = getApp(new DummyAuthService());
  it('should create a new applicant submission', async () => {
    const testApplicantResp = await request(dummyAuthApp)
      .post('/applicants')
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
    const { body } = await request(dummyAuthApp)
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
    const { body } = await request(dummyAuthApp)
      .post('/applicants/1/submissions')
      .send({ ...testSubmission })
      .expect(400);
    expect(body).toHaveProperty('title', 'Validation Error');
  });

  it('should throw error if request body has invalid openToRelocate value', async () => {
    const testSubmission = applicantSubmissionGenerator.getAPIRequestBody();
    const { body } = await request(dummyAuthApp)
      .post('/applicants/1/submissions')
      .send({ ...testSubmission, openToRelocate: 'idk maybe' })
      .expect(400);
    expect(body).toHaveProperty('title', 'Validation Error');
  });
});

describe('POST /applicants/:id/submissions/draft', () => {
  const dummyAuthApp = getApp(new DummyAuthService());
  it('should create a new draft applicant submission', async () => {
    const testApplicantResp = await request(dummyAuthApp)
      .post('/applicants')
      .send({
        name: 'Bob Boberson',
        email: 'bboberson@gmail.com',
        preferredContact: 'sms',
        searchStatus: 'active',
        acceptedTerms: true,
        acceptedPrivacy: true,
      });
    const { id }: { id: number } = testApplicantResp.body;
    const testBody: ApplicantDraftSubmissionBody = {
      resumeUrl: 'https://bobcanbuild.com',
    };
    const { body } = await request(dummyAuthApp)
      .post(`/applicants/${id}/submissions/draft`)
      .send(testBody)
      .expect(200);
    expect(body).toHaveProperty('id');
  });

  it('should update an existing draft applicant submission', async () => {
    const testApplicantResp = await request(dummyAuthApp)
      .post('/applicants')
      .send({
        name: 'Bob Boberson',
        email: 'bboberson@gmail.com',
        preferredContact: 'sms',
        searchStatus: 'active',
        acceptedTerms: true,
        acceptedPrivacy: true,
      });
    const { id }: { id: number } = testApplicantResp.body;
    const draftBody: ApplicantDraftSubmissionBody = {
      resumeUrl: 'https://bobcanbuild.com',
    };
    const draftUpdateBody: ApplicantDraftSubmissionBody = {
      resumeUrl: 'https://bobcanREALLYbuild.org',
    };
    const { body: draftResp } = await request(dummyAuthApp)
      .post(`/applicants/${id}/submissions/draft`)
      .send(draftBody)
      .expect(200);
    expect(draftResp).toHaveProperty('resumeUrl', 'https://bobcanbuild.com');
    const { body } = await request(dummyAuthApp)
      .post(`/applicants/${id}/submissions/draft`)
      .send(draftUpdateBody)
      .expect(200);
    expect(body).toHaveProperty('resumeUrl', 'https://bobcanREALLYbuild.org');
  });
});
