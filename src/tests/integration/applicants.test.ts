import request from 'supertest';
import getApp from '@App/app.js';
import {
  ApplicantDraftSubmissionBody,
  ApplicantDraftSubmissionResponseBody,
  ApplicantResponseBody,
  ApplicantSubmissionBody,
} from '@App/resources/types/applicants.js';
import { itif, getRandomString } from '@App/tests/util/helpers.js';
import prisma from '@App/resources/client.js';
import AuthService from '@App/services/AuthService.js';
import configLoader from '@App/services/configLoader.js';

import cookie from 'cookie';
import cookieParser from 'cookie-parser';
import { ApplicantSession, Prisma } from '@prisma/client';
import applicantSubmissionGenerator from '../fixtures/applicantSubmissionGenerator.js';
import DummyAuthService from '../fixtures/DummyAuthService.js';
import DummyMonitoringService from '../fixtures/DummyMonitoringService.js';
import authHelper from '../util/auth.js';
import DummyEmailService from '../fixtures/DummyEmailService.js';
import DummySESService from '../fixtures/DummySesService.js';

let testUserIDs: Array<string> = [];
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
      new DummyEmailService(new DummySESService(), appConfig),
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
    it('should throw 409 error when creating a duplicate applicant', async () => {
      const dummyAuthService = new DummyAuthService();
      // eslint-disable-next-line @typescript-eslint/require-await
      dummyAuthService.userExists = async () => true;
      const dummyApp = getApp(
        dummyAuthService,
        new DummyMonitoringService(),
        new DummyEmailService(new DummySESService(), appConfig),
        appConfig,
      );
      await request(dummyApp).post('/applicants').send({
        name: 'Bob Boberson',
        email: 'bboberson123@gmail.com',
        preferredContact: 'sms',
        searchStatus: 'active',
        acceptedTerms: true,
        acceptedPrivacy: true,
      });
      const { body } = await request(dummyApp)
        .post('/applicants')
        .send({
          name: 'Bob Boberson',
          email: 'bboberson123@gmail.com',
          preferredContact: 'sms',
          searchStatus: 'active',
          acceptedTerms: true,
          acceptedPrivacy: true,
        })
        .expect(409);
      expect(body).toHaveProperty('detail', 'User must login');
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
    // Use case: A user has registered with Auth0 via a social provider (and therefore has an Auth0 JWT) but
    // provides a different email when they register for Tekalo.
    test('Should throw error if email in JWT is different than that of request payload', async () => {
      const token = await authHelper.getToken('bobisthebest@gmail.com');
      const { body } = await request(dummyAuthApp)
        .post('/applicants')
        .send({
          name: 'Bob Boberson',
          email: 'bboberson@gmail.com',
          preferredContact: 'whatsapp',
          searchStatus: 'active',
          acceptedTerms: true,
          acceptedPrivacy: true,
        })
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
      expect(body).toHaveProperty('detail', 'Invalid email provided');
    });
    test('Should update applicantID in cookie with 2 subsequent requests for 2 different users', async () => {
      type RespHeaders = {
        'set-cookie': string;
      };
      const { clientSecret } = configLoader.loadConfig().auth0.api;
      const agent = request.agent(dummyAuthApp);

      const {
        headers: bobHeaders,
        body: bobBody,
      }: { headers: RespHeaders; body: ApplicantResponseBody } = await agent
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

      const bobCookies = bobHeaders['set-cookie'];
      expect(bobCookies).toBeTruthy();
      const bobParsedCookie = cookie.parse(bobCookies[0]);
      const bobSessionId = cookieParser.signedCookie(
        bobParsedCookie['connect.sid'],
        clientSecret,
      );
      const bobSavedSession: ApplicantSession =
        await prisma.applicantSession.findFirstOrThrow({
          where: { sid: bobSessionId as string },
        });

      expect(bobSavedSession.sess as Prisma.JsonObject).toHaveProperty(
        'applicant',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        { id: bobBody.id },
      );

      const {
        headers: timHeaders,
        body: timBody,
      }: { headers: RespHeaders; body: ApplicantResponseBody } = await agent
        .post('/applicants')
        .send({
          name: 'Tim Timerson',
          email: `ttimerson${getRandomString()}@gmail.com`,
          preferredContact: 'sms',
          searchStatus: 'active',
          acceptedTerms: true,
          acceptedPrivacy: true,
        })
        .expect(200);

      const timCookies = timHeaders['set-cookie'];
      expect(timCookies).toBeTruthy();
      const timParsedCookie = cookie.parse(timCookies[0]);
      const timSessionId = cookieParser.signedCookie(
        timParsedCookie['connect.sid'],
        clientSecret,
      );
      const timSavedSession: ApplicantSession =
        await prisma.applicantSession.findFirstOrThrow({
          where: { sid: timSessionId as string },
        });

      expect(timSavedSession.sess as Prisma.JsonObject).toHaveProperty(
        'applicant',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        { id: timBody.id },
      );
    });
  });

  describe('Auth0 Integration', () => {
    const app = getApp(
      authService,
      new DummyMonitoringService(),
      new DummyEmailService(new DummySESService(), appConfig),
      appConfig,
    );
    afterEach(async () => {
      if (testUserIDs.length > 0) {
        const deletionRequests = Array<Promise<void>>();
        const auth0Service = authService.getClient();
        testUserIDs.forEach((id) => {
          deletionRequests.push(auth0Service.deleteUser({ id }));
        });
        await Promise.all(deletionRequests);
        testUserIDs = [];
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
          testUserIDs.push(body.auth0Id);
        }
        expect(body).toHaveProperty('auth0Id');
        expect(body).toHaveProperty('email');
      },
    );

    itif('CI' in process.env)(
      'should return a 409 if user already exists in Auth0 with username-password connection',
      async () => {
        const bobsEmail = `bboberson${getRandomString()}@gmail.com`;
        // successfully create first applicant
        const { body: successBody }: { body: ApplicantResponseBody } =
          await request(app).post('/applicants').send({
            name: 'Bob Boberson',
            email: bobsEmail,
            preferredContact: 'sms',
            searchStatus: 'active',
            acceptedTerms: true,
            acceptedPrivacy: true,
          });
        if (successBody.auth0Id) {
          testUserIDs.push(successBody.auth0Id);
        }
        const failedResp = await request(app).post('/applicants').send({
          name: 'Bob Boberson',
          email: bobsEmail,
          preferredContact: 'sms',
          searchStatus: 'active',
          acceptedTerms: true,
          acceptedPrivacy: true,
        });
        const failedBody: ApplicantResponseBody = failedResp.body;
        // just in case our test fails and we mistakingly successfully created our second applicant
        if (failedResp && failedBody.auth0Id) {
          testUserIDs.push(failedBody.auth0Id);
        }
        expect(failedResp).toHaveProperty('status', 409);
      },
    );
  });
});

describe('POST /applicants/me/submissions', () => {
  const dummyAuthApp = getApp(
    new DummyAuthService(),
    new DummyMonitoringService(),
    new DummyEmailService(new DummySESService(), appConfig),
    appConfig,
  );

  describe('JWT authentication', () => {
    it('should create a new applicant submission', async () => {
      const randomString = getRandomString();
      const token = await authHelper.getToken(
        `bboberson${randomString}@gmail.com`,
      );
      await request(dummyAuthApp)
        .post('/applicants')
        .send({
          name: 'Bob Boberson',
          auth0Id: 'auth0|123456',
          email: `bboberson${randomString}@gmail.com`,
          preferredContact: 'email',
          searchStatus: 'active',
          acceptedTerms: true,
          acceptedPrivacy: true,
        });
      const testBody: ApplicantSubmissionBody =
        applicantSubmissionGenerator.getAPIRequestBody();
      const { body } = await request(dummyAuthApp)
        .post('/applicants/me/submissions')
        .send(testBody)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(body).toHaveProperty('id');
    });

    it('should return 400 error for missing years of experience (yoe)', async () => {
      const randomString = getRandomString();
      const testSubmission = applicantSubmissionGenerator.getAPIRequestBody();
      const token = await authHelper.getToken(
        `bboberson${randomString}@gmail.com`,
      );
      await request(dummyAuthApp)
        .post('/applicants')
        .send({
          name: 'Bob Boberson',
          auth0Id: 'auth0|123456',
          email: `bboberson${randomString}@gmail.com`,
          preferredContact: 'email',
          searchStatus: 'active',
          acceptedTerms: true,
          acceptedPrivacy: true,
        });
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      delete testSubmission.yoe;
      const { body } = await request(dummyAuthApp)
        .post('/applicants/me/submissions')
        .send({ ...testSubmission })
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
      expect(body).toHaveProperty('title', 'Validation Error');
    });

    it('should return 400 error if request body has invalid openToRelocate value', async () => {
      const randomString = getRandomString();
      const testSubmission = applicantSubmissionGenerator.getAPIRequestBody();
      const token = await authHelper.getToken(
        `bboberson${randomString}@gmail.com`,
      );
      await request(dummyAuthApp)
        .post('/applicants')
        .send({
          name: 'Bob Boberson',
          auth0Id: 'auth0|123456',
          email: `bboberson${randomString}@gmail.com`,
          preferredContact: 'email',
          searchStatus: 'active',
          acceptedTerms: true,
          acceptedPrivacy: true,
        });
      const { body } = await request(dummyAuthApp)
        .post('/applicants/me/submissions')
        .send({ ...testSubmission, openToRelocate: 'idk maybe' })
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
      expect(body).toHaveProperty('title', 'Validation Error');
    });
  });

  describe('Cookie authentication', () => {
    it('should create a new applicant submission', async () => {
      const agent = request.agent(dummyAuthApp);
      await agent.post('/applicants').send({
        name: 'Bob Boberson',
        auth0Id: 'auth0|123456',
        email: 'bboberson@gmail.com',
        preferredContact: 'email',
        searchStatus: 'active',
        acceptedTerms: true,
        acceptedPrivacy: true,
      });
      const testBody: ApplicantSubmissionBody =
        applicantSubmissionGenerator.getAPIRequestBody();
      const { body } = await agent
        .post('/applicants/me/submissions')
        .send(testBody)
        .expect(200);
      expect(body).toHaveProperty('id');
    });
  });
});

describe('DELETE /applicants/:id', () => {
  describe('Auth0 Integration', () => {
    afterEach(async () => {
      if (testUserIDs.length > 0) {
        const deletionRequests = Array<Promise<void>>();
        const auth0Service = authService.getClient();
        testUserIDs.forEach((id) => {
          deletionRequests.push(auth0Service.deleteUser({ id }));
        });
        await Promise.all(deletionRequests);
        testUserIDs = [];
      }
    });
    const app = getApp(
      authService,
      new DummyMonitoringService(),
      new DummyEmailService(new DummySESService(), appConfig),
      appConfig,
    );
    itif('CI' in process.env)(
      'should delete an existing applicant from Auth0 and from database',
      async () => {
        const randomString = getRandomString();
        const token = await authHelper.getToken(
          `bboberson${randomString}@gmail.com`,
        );
        const { body }: { body: ApplicantResponseBody } = await request(app)
          .post('/applicants')
          .send({
            name: 'Bob Boberson',
            email: `bboberson${randomString}@gmail.com`,
            preferredContact: 'email',
            searchStatus: 'active',
            acceptedTerms: true,
            acceptedPrivacy: true,
          });
        if (body.auth0Id) {
          testUserIDs.push(body.auth0Id);
        }
        await request(app)
          .delete('/applicants/me')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);
      },
    );
  });
  describe('No Auth0 Integration', () => {
    const appNoAuth = getApp(
      new DummyAuthService(),
      new DummyMonitoringService(),
      new DummyEmailService(new DummySESService(), appConfig),
      appConfig,
    );

    it('should return 401 for un-authed request', async () => {
      await request(appNoAuth).delete('/applicants/me').expect(401);
    });

    it('should return 200 when authenticating with valid token, but applicant does not exist in the database', async () => {
      const token = await authHelper.getToken(
        `bboberson${getRandomString()}@gmail.com`,
      );
      await request(appNoAuth)
        .delete('/applicants/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });

    it('should delete applicant from database', async () => {
      const randomString = getRandomString();
      const token = await authHelper.getToken(
        `bboberson${randomString}@gmail.com`,
      );
      await request(appNoAuth)
        .post('/applicants')
        .send({
          name: 'Bob Boberson',
          email: `bboberson${randomString}@gmail.com`,
          preferredContact: 'email',
          searchStatus: 'active',
          acceptedTerms: true,
          acceptedPrivacy: true,
        });
      const { body } = await request(appNoAuth)
        .delete('/applicants/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(body).toEqual({ id: expect.any(Number) });
    });
  });
});

describe('POST /applicants/me/submissions/draft', () => {
  const dummyAuthApp = getApp(
    new DummyAuthService(),
    new DummyMonitoringService(),
    new DummyEmailService(new DummySESService(), appConfig),
    appConfig,
  );
  it('should not allow applicant to save draft submission without a valid cookie or JWT supplied', async () => {
    // Supertest will not save cookies (each request has a separate cookie jar)
    await request(dummyAuthApp).post('/applicants').send({
      name: 'Bob Boberson',
      email: 'bboberson@gmail.com',
      preferredContact: 'sms',
      searchStatus: 'active',
      acceptedTerms: true,
      acceptedPrivacy: true,
    });
    const testBody: ApplicantDraftSubmissionBody = {
      resumeUrl: 'https://bobcanbuild.com',
    };
    const { body } = await request(dummyAuthApp)
      .post('/applicants/me/submissions/draft')
      .send(testBody)
      .expect(401);
    expect(body).toHaveProperty('title', 'Cannot authenticate request');
  });

  describe('Cookie based authentication', () => {
    it('should create a new draft applicant submission', async () => {
      const agent = request.agent(dummyAuthApp);
      await agent.post('/applicants').send({
        name: 'Bob Boberson',
        email: 'bboberson@gmail.com',
        preferredContact: 'sms',
        searchStatus: 'active',
        acceptedTerms: true,
        acceptedPrivacy: true,
      });
      const testBody: ApplicantDraftSubmissionBody = {
        resumeUrl: 'https://bobcanbuild.com',
      };
      const { body } = await agent
        .post('/applicants/me/submissions/draft')
        .send(testBody)
        .expect(200);
      expect(body).toHaveProperty('id');
    });

    it('should update an existing draft applicant submission', async () => {
      const agent = request.agent(dummyAuthApp);
      await agent.post('/applicants').send({
        name: 'Bob Boberson',
        email: 'bboberson@gmail.com',
        preferredContact: 'sms',
        searchStatus: 'active',
        acceptedTerms: true,
        acceptedPrivacy: true,
      });
      const draftBody: ApplicantDraftSubmissionBody = {
        resumeUrl: 'https://bobcanbuild.com/resume',
      };
      const draftUpdateBody: ApplicantDraftSubmissionBody = {
        resumeUrl: 'https://bobcanREALLYbuild.com/resume',
      };
      const { body: draftResp } = await agent
        .post('/applicants/me/submissions/draft')
        .send(draftBody)
        .expect(200);
      expect(draftResp).toHaveProperty(
        'resumeUrl',
        'https://bobcanbuild.com/resume',
      );
      const { body } = await agent
        .post('/applicants/me/submissions/draft')
        .send(draftUpdateBody)
        .expect(200);
      expect(body).toHaveProperty(
        'resumeUrl',
        'https://bobcanREALLYbuild.com/resume',
      );
    });
  });

  describe('JWT based authentication', () => {
    it('should create a new draft applicant submission', async () => {
      const token = await authHelper.getToken('bboberson@gmail.com');
      await request(dummyAuthApp).post('/applicants').send({
        name: 'Bob Boberson',
        email: 'bboberson@gmail.com',
        preferredContact: 'sms',
        searchStatus: 'active',
        acceptedTerms: true,
        acceptedPrivacy: true,
      });
      const testBody: ApplicantDraftSubmissionBody = {
        resumeUrl: 'https://bobcanbuild.com',
      };
      const { body } = await request(dummyAuthApp)
        .post('/applicants/me/submissions/draft')
        .set('Authorization', `Bearer ${token}`)
        .send(testBody)
        .expect(200);
      expect(body).toHaveProperty('id');
    });

    it('should not allow applicant to save draft submission of a non-existent user', async () => {
      const token = await authHelper.getToken('bibbitybobbityboo@gmail.com');
      await request(dummyAuthApp).post('/applicants').send({
        name: 'Pat Patterson',
        email: 'bboberson@gmail.com',
        preferredContact: 'sms',
        searchStatus: 'active',
        acceptedTerms: true,
        acceptedPrivacy: true,
      });
      const testBody: ApplicantDraftSubmissionBody = {
        resumeUrl: 'https://bobcanbuild.com',
      };
      const { body } = await request(dummyAuthApp)
        .post('/applicants/me/submissions/draft')
        .set('Authorization', `Bearer ${token}`)
        .send(testBody)
        .expect(404);
      expect(body).toHaveProperty('title', 'Not Found');
    });
  });
});

describe('GET /applicants/me/submissions', () => {
  const dummyAuthApp = getApp(
    new DummyAuthService(),
    new DummyMonitoringService(),
    new DummyEmailService(new DummySESService(), appConfig),
    appConfig,
  );

  describe('JWT authentication', () => {
    it('should get current applicants draft submission with token', async () => {
      // We create draft submission with cookie, get /me/submissions with JWT
      const agent = request.agent(dummyAuthApp);
      const token = await authHelper.getToken('bboberson@gmail.com');
      await agent.post('/applicants').send({
        name: 'Bob Boberson',
        email: 'bboberson@gmail.com',
        preferredContact: 'sms',
        searchStatus: 'active',
        acceptedTerms: true,
        acceptedPrivacy: true,
      });
      const testBody: ApplicantDraftSubmissionBody = {
        resumeUrl: 'https://bobcanbuild.com',
      };
      await agent
        .post('/applicants/me/submissions/draft')
        .send(testBody)
        .expect(200);
      const { body }: { body: ApplicantDraftSubmissionResponseBody } =
        await request(dummyAuthApp)
          .get('/applicants/me/submissions')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);
      expect(body).toHaveProperty('isFinal', false);
      expect(body).toHaveProperty('submission');
      expect(body.submission).toHaveProperty('id');
    });

    it('should get current applicants draft submission with cookie', async () => {
      const agent = request.agent(dummyAuthApp);
      await agent.post('/applicants').send({
        name: 'Bob Boberson',
        email: 'bboberson@gmail.com',
        preferredContact: 'sms',
        searchStatus: 'active',
        acceptedTerms: true,
        acceptedPrivacy: true,
      });
      const testBody: ApplicantDraftSubmissionBody = {
        resumeUrl: 'https://bobcanbuild.com',
      };
      await agent
        .post('/applicants/me/submissions/draft')
        .send(testBody)
        .expect(200);
      const { body }: { body: ApplicantDraftSubmissionResponseBody } =
        await agent.get('/applicants/me/submissions').expect(200);
      expect(body).toHaveProperty('isFinal', false);
      expect(body).toHaveProperty('submission');
      expect(body.submission).toHaveProperty('id');
    });

    it('should get current applicants final submission', async () => {
      const token = await authHelper.getToken('bboberson@gmail.com');
      await request(dummyAuthApp).post('/applicants').send({
        name: 'Bob Boberson',
        email: 'bboberson@gmail.com',
        preferredContact: 'sms',
        searchStatus: 'active',
        acceptedTerms: true,
        acceptedPrivacy: true,
      });
      const testBody: ApplicantDraftSubmissionBody =
        applicantSubmissionGenerator.getAPIRequestBody();
      await request(dummyAuthApp)
        .post('/applicants/me/submissions')
        .send(testBody)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      const { body }: { body: ApplicantDraftSubmissionResponseBody } =
        await request(dummyAuthApp)
          .get('/applicants/me/submissions')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);
      expect(body).toHaveProperty('isFinal', true);
      expect(body).toHaveProperty('submission');
      expect(body.submission).toHaveProperty('id');
    });

    it('should return 401 if no JWT provided', async () => {
      await request(dummyAuthApp).get('/applicants/me/submissions').expect(401);
    });
    it('should return 404 if applicant does not exist', async () => {
      const token = await authHelper.getToken('bboberson@gmail.com');
      const { body } = await request(dummyAuthApp)
        .get('/applicants/me/submissions')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
      expect(body).toHaveProperty('title', 'Not Found');
    });
    it('should return 200 if applicant exists but has no submissions', async () => {
      const token = await authHelper.getToken('bboberson@gmail.com');
      await request(dummyAuthApp).post('/applicants').send({
        name: 'Bob Boberson',
        email: 'bboberson@gmail.com',
        preferredContact: 'sms',
        searchStatus: 'active',
        acceptedTerms: true,
        acceptedPrivacy: true,
      });
      const { body } = await request(dummyAuthApp)
        .get('/applicants/me/submissions')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(body).toHaveProperty('isFinal', false);
      expect(body).toHaveProperty('submission', null);
    });
  });
});

describe('PUT /applicants/me/state', () => {
  const dummyAuthApp = getApp(
    new DummyAuthService(),
    new DummyMonitoringService(),
    new DummyEmailService(new DummySESService(), appConfig),
    appConfig,
  );

  it('should pause and un-pause an applicants status', async () => {
    const randomString = getRandomString();
    const token = await authHelper.getToken(
      `bboberson${randomString}@gmail.com`,
    );
    await request(dummyAuthApp)
      .post('/applicants')
      .send({
        name: 'Bob Boberson',
        auth0Id: 'auth0|123456',
        email: `bboberson${randomString}@gmail.com`,
        preferredContact: 'email',
        searchStatus: 'active',
        acceptedTerms: true,
        acceptedPrivacy: true,
      });
    const { body: pausedBody } = await request(dummyAuthApp)
      .put('/applicants/me/state')
      .send({ pause: true })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(pausedBody).toHaveProperty('id');
    expect(pausedBody).toHaveProperty('isPaused', true);
    const { body: unPausedBody } = await request(dummyAuthApp)
      .put('/applicants/me/state')
      .send({ pause: false })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(unPausedBody).toHaveProperty('id');
    expect(unPausedBody).toHaveProperty('isPaused', false);
  });

  it('should return 404 for non-existent applicant', async () => {
    const token = await authHelper.getToken('bboberson@gmail.com');
    await request(dummyAuthApp)
      .put('/applicants/me/state')
      .send({ pause: true })
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });
});

describe('GET /applicants/me', () => {
  const dummyAuthApp = getApp(
    new DummyAuthService(),
    new DummyMonitoringService(),
    new DummyEmailService(new DummySESService(), appConfig),
    appConfig,
  );

  it('should return applicant-level information with a JWT', async () => {
    const randomString = getRandomString();
    const token = await authHelper.getToken(
      `bboberson${randomString}@gmail.com`,
    );
    await request(dummyAuthApp)
      .post('/applicants')
      .send({
        name: 'Bob Boberson',
        email: `bboberson${randomString}@gmail.com`,
        preferredContact: 'sms',
        searchStatus: 'active',
        acceptedTerms: true,
        acceptedPrivacy: true,
      });
    const { body } = await request(dummyAuthApp)
      .get('/applicants/me')
      .set('Authorization', `Bearer ${token}`);
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('name');
    expect(body).toHaveProperty('isPaused');
  });

  it('should return 401 with a cookie but without a JWT', async () => {
    const agent = request.agent(dummyAuthApp);
    await agent.post('/applicants').send({
      name: 'Bob Boberson',
      auth0Id: 'auth0|123456',
      email: 'bboberson@gmail.com',
      preferredContact: 'email',
      searchStatus: 'active',
      acceptedTerms: true,
      acceptedPrivacy: true,
    });
    await agent.get('/applicants/me').expect(401);
  });
});
