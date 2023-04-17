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
import configLoader from '@App/services/configLoader.js';

import applicantSubmissionGenerator from '../fixtures/applicantSubmissionGenerator.js';
import DummyAuthService from '../fixtures/DummyAuthService.js';
import DummyMonitoringService from '../fixtures/DummyMonitoringService.js';

let testUserID: string;
const authService = new AuthService();

afterEach(async () => {
  await prisma.applicantDraftSubmission.deleteMany();
  await prisma.applicantSubmission.deleteMany();
  await prisma.applicant.deleteMany();
  await prisma.applicantDeletionRequests.deleteMany();
});

const appConfig = configLoader.loadConfig();

describe('POST /applicants', () => {
  describe('No Auth0', () => {
    const dummyAuthApp = getApp(
      new DummyAuthService(),
      new DummyMonitoringService(),
      appConfig,
    );
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
    const app = getApp(authService, new DummyMonitoringService(), appConfig);
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
            auth0Id: 'auth0|123456',
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
  const dummyAuthApp = getApp(
    new DummyAuthService(),
    new DummyMonitoringService(),
    appConfig,
  );
  it('should create a new applicant submission', async () => {
    const testApplicantResp = await request(dummyAuthApp)
      .post('/applicants')
      .send({
        name: 'Bob Boberson',
        auth0Id: 'auth0|123456',
        email: `bboberson${getRandomString()}@gmail.com`,
        preferredContact: 'email',
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

describe('DELETE /applicants', () => {
  describe('Auth0 Integration', () => {
    afterEach(async () => {
      if (testUserID) {
        const auth0Service = authService.getClient();
        await auth0Service.deleteUser({ id: testUserID });
      }
    });
    const app = getApp(authService, new DummyMonitoringService(), appConfig);
    itif('CI' in process.env)(
      'should delete an existing applicant from Auth0 and from database',
      async () => {
        const { body }: { body: ApplicantResponseBody } = await request(app)
          .post('/applicants')
          .send({
            name: 'Bob Boberson',
            email: `bboberson${getRandomString()}@gmail.com`,
            preferredContact: 'email',
            searchStatus: 'active',
            acceptedTerms: true,
            acceptedPrivacy: true,
          });
        if (body.auth0Id) {
          testUserID = body.auth0Id;
        }
        const { id } = body;
        await request(app).delete(`/applicants/${id}`).expect(200);
      },
    );
  });
  describe('No Auth0 Integration', () => {
    const appNoAuth = getApp(
      new DummyAuthService(),
      new DummyMonitoringService(),
      appConfig,
    );

    it('should return 400 for non-existent applicant id', async () => {
      const { body } = await request(appNoAuth)
        .delete('/applicants/99999')
        .expect(400);
      expect(body).toHaveProperty('title', 'Applicant Deletion Error');
    });

    it('should delete applicant from database', async () => {
      const { body }: { body: ApplicantResponseBody } = await request(appNoAuth)
        .post('/applicants')
        .send({
          name: 'Bob Boberson',
          email: `bboberson${getRandomString()}@gmail.com`,
          preferredContact: 'email',
          searchStatus: 'active',
          acceptedTerms: true,
          acceptedPrivacy: true,
        });
      if (body.auth0Id) {
        testUserID = body.auth0Id;
      }
      const { id } = body;
      await request(appNoAuth).delete(`/applicants/${id}`).expect(200);
    });
  });
});

describe('POST /applicants/:id/submissions/draft', () => {
  const dummyAuthApp = getApp(
    new DummyAuthService(),
    new DummyMonitoringService(),
    appConfig,
  );
  it('should create a new draft applicant submission', async () => {
    const agent = request.agent(dummyAuthApp);
    const testApplicantResp = await agent.post('/applicants').send({
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
    const { body } = await agent
      .post(`/applicants/${id}/submissions/draft`)
      .send(testBody)
      .expect(200);
    expect(body).toHaveProperty('id');
  });

  it('should update an existing draft applicant submission', async () => {
    const agent = request.agent(dummyAuthApp);
    const testApplicantResp = await agent.post('/applicants').send({
      name: 'Bob Boberson',
      email: 'bboberson@gmail.com',
      preferredContact: 'sms',
      searchStatus: 'active',
      acceptedTerms: true,
      acceptedPrivacy: true,
    });
    const { id }: { id: number } = testApplicantResp.body;
    const draftBody: ApplicantDraftSubmissionBody = {
      resumeUrl: 'https://bobcanbuild.com/resume',
    };
    const draftUpdateBody: ApplicantDraftSubmissionBody = {
      resumeUrl: 'https://bobcanREALLYbuild.com/resume',
    };
    const { body: draftResp } = await agent
      .post(`/applicants/${id}/submissions/draft`)
      .send(draftBody)
      .expect(200);
    expect(draftResp).toHaveProperty(
      'resumeUrl',
      'https://bobcanbuild.com/resume',
    );
    const { body } = await agent
      .post(`/applicants/${id}/submissions/draft`)
      .send(draftUpdateBody)
      .expect(200);
    expect(body).toHaveProperty(
      'resumeUrl',
      'https://bobcanREALLYbuild.com/resume',
    );
  });

  it('should not allow applicant to save draft submission of another user', async () => {
    // Using superagent here so each request share's a cookie jar
    const agent = request.agent(dummyAuthApp);
    const testApplicantResp = await agent.post('/applicants').send({
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
    const { body } = await agent
      .post(`/applicants/${id + 1}/submissions/draft`)
      .send(testBody)
      .expect(401);
    expect(body).toHaveProperty('title', 'Cannot verify applicant request');
  });

  it('should not allow applicant to save draft submission without a valid cookie supplied', async () => {
    // Supertest will not save cookies (each request has a separate cookie jar)
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
      .expect(401);
    expect(body).toHaveProperty('title', 'Cannot verify applicant request');
  });
});

describe('PUT /applicants/:id/state', () => {
  const dummyAuthApp = getApp(
    new DummyAuthService(),
    new DummyMonitoringService(),
    appConfig,
  );

  it('should pause and un-pause an applicants status', async () => {
    const testApplicantResp = await request(dummyAuthApp)
      .post('/applicants')
      .send({
        name: 'Bob Boberson',
        auth0Id: 'auth0|123456',
        email: `bboberson${getRandomString()}@gmail.com`,
        preferredContact: 'email',
        searchStatus: 'active',
        acceptedTerms: true,
        acceptedPrivacy: true,
      });
    const { id }: { id: number } = testApplicantResp.body;
    const { body: pausedBody } = await request(dummyAuthApp)
      .put(`/applicants/${id}/state`)
      .send({ pause: true })
      .expect(200);
    expect(pausedBody).toEqual({ id, isPaused: true });
    const { body: unPausedBody } = await request(dummyAuthApp)
      .put(`/applicants/${id}/state`)
      .send({ pause: false })
      .expect(200);
    expect(unPausedBody).toEqual({ id, isPaused: false });
  });

  it('should return 404 for non-existent applicant', async () => {
    await request(dummyAuthApp)
      .put('/applicants/99/state')
      .send({ pause: true })
      .expect(404);
  });
});
