import request from 'supertest';
import { jest } from '@jest/globals';
import cookie from 'cookie';
import cookieParser from 'cookie-parser';
import { Applicant, Session, Upload } from '@prisma/client';
import getApp from '@App/app.js';
import {
  ApplicantDraftSubmissionBody,
  ApplicantDraftSubmissionResponseBody,
  ApplicantResponseBody,
  ApplicantSubmissionBody,
  ApplicantCreateSubmissionResponse,
  ApplicantGetSubmissionResponse,
} from '@App/resources/types/applicants.js';
import getDummyApp from '@App/tests/fixtures/appGenerator.js';
import { itif, getRandomString } from '@App/tests/util/helpers.js';
import { prisma, sessionStore } from '@App/resources/client.js';
import AuthService from '@App/services/AuthService.js';
import configLoader from '@App/services/configLoader.js';

import {
  UploadResponseBody,
  UploadStateResponseBody,
} from '@App/resources/types/uploads.js';
import applicantSubmissionGenerator from '../fixtures/applicantSubmissionGenerator.js';
import DummyAuthService from '../fixtures/DummyAuthService.js';
import DummyMonitoringService from '../fixtures/DummyMonitoringService.js';
import authHelper, { TokenOptions } from '../util/auth.js';
import DummyEmailService from '../fixtures/DummyEmailService.js';
import DummySESService from '../fixtures/DummySesService.js';
import DummyUploadService from '../fixtures/DummyUploadService.js';
import DummyS3Service from '../fixtures/DummyS3Service.js';

let testUserIDs: Array<string> = [];
const authService = new AuthService();

const seedResumeUpload = async (applicantId: number): Promise<Upload> =>
  prisma.upload.create({
    data: {
      type: 'RESUME',
      status: 'SUCCESS',
      applicantId,
      originalFilename: 'myresume.pdf',
      contentType: 'application/pdf',
    },
  });

afterEach(async () => {
  await prisma.upload.deleteMany();
  await prisma.applicantDraftSubmission.deleteMany();
  await prisma.applicantSubmission.deleteMany();
  await prisma.applicant.deleteMany();
  await prisma.applicantDeletionRequests.deleteMany();
  jest.restoreAllMocks();
});

afterAll(async () => {
  await sessionStore.shutdown();
});

const dummyApp = getDummyApp();

const deleteAuth0Users = async () => {
  if (testUserIDs.length) {
    const deletionRequests = Array<Promise<void>>();
    const auth0Service = authService.getClient();
    testUserIDs.forEach((id) => {
      deletionRequests.push(auth0Service.deleteUser({ id }));
    });
    await Promise.all(deletionRequests);
    testUserIDs = [];
  }
};

const appConfig = configLoader.loadConfig();

describe('POST /applicants', () => {
  describe('No Auth0', () => {
    it('should create a new applicant only in database', async () => {
      const randomString = getRandomString();
      const { body } = await request(dummyApp)
        .post('/applicants')
        .send({
          name: 'Bob Boberson',
          pronoun: 'he/his',
          phone: '123-456-7899',
          email: `bboberson${randomString}@gmail.com`,
          preferredContact: 'email',
          searchStatus: 'active',
          acceptedTerms: true,
          acceptedPrivacy: true,
        })
        .expect(200);
      expect(body).toHaveProperty('id');
      expect(body).toHaveProperty(
        'email',
        `bboberson${randomString}@gmail.com`,
      );
      expect(body).toHaveProperty('auth0Id');
    });
    it('should lowercase email before saving to database', async () => {
      const randomString = getRandomString();
      const { body } = await request(dummyApp)
        .post('/applicants')
        .send({
          name: 'Bob Boberson',
          pronoun: 'he/his',
          phone: '123-456-7899',
          email: `BBoberson${randomString}@gmail.com`,
          preferredContact: 'email',
          searchStatus: 'active',
          acceptedTerms: true,
          acceptedPrivacy: true,
        })
        .expect(200);
      expect(body).toHaveProperty('id');
      expect(body).toHaveProperty(
        'email',
        `bboberson${randomString}@gmail.com`,
      );
      expect(body).toHaveProperty('auth0Id');
    });
    it('should throw 400 error for missing email', async () => {
      const { body } = await request(dummyApp)
        .post('/applicants')
        .send({ name: 'Bob Boberson' })
        .expect(400);
      expect(body).toHaveProperty('title', 'Validation Error');
    });
    it('should throw 400 error if acceptedPrivacy false', async () => {
      const { body } = await request(dummyApp)
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
      const authServiceApp = getDummyApp(dummyAuthService);
      await request(authServiceApp).post('/applicants').send({
        name: 'Bob Boberson',
        email: 'bboberson123@gmail.com',
        preferredContact: 'sms',
        searchStatus: 'active',
        acceptedTerms: true,
        acceptedPrivacy: true,
      });
      const { body } = await request(authServiceApp)
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
      const { body } = await request(dummyApp)
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
      const { body } = await request(dummyApp)
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
      const agent = request.agent(dummyApp);

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
      const bobSavedSession: Session = await prisma.session.findFirstOrThrow({
        where: { sid: bobSessionId as string },
      });

      expect(JSON.parse(bobSavedSession.data)).toHaveProperty(
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
      const timSavedSession: Session = await prisma.session.findFirstOrThrow({
        where: { sid: timSessionId as string },
      });

      expect(JSON.parse(timSavedSession.data)).toHaveProperty(
        'applicant',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        { id: timBody.id },
      );
    });
  });

  describe('Auth0 Integration', () => {
    const app = getApp(
      authService,
      new DummyMonitoringService(prisma),
      new DummyEmailService(new DummySESService(), appConfig),
      new DummyUploadService(prisma, new DummyS3Service(), appConfig),
      appConfig,
    );
    afterEach(async () => {
      await deleteAuth0Users();
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
  it('should return 401 for request with no cookie or JWT', async () => {
    const randomString = getRandomString();
    await request(dummyApp)
      .post('/applicants/me/submissions')
      .send({
        name: 'Bob Boberson',
        pronoun: 'he/his',
        phone: '123-456-7899',
        email: `bboberson${randomString}@gmail.com`,
        preferredContact: 'email',
        searchStatus: 'active',
        acceptedTerms: true,
        acceptedPrivacy: true,
      })
      .expect(401);
  });
  describe('JWT authentication', () => {
    it('should create a new applicant submission', async () => {
      const randomString = getRandomString();
      const token = await authHelper.getToken(
        `bboberson${randomString}@gmail.com`,
      );
      const { body: applicantBody }: { body: ApplicantResponseBody } =
        await request(dummyApp)
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
      // create resume upload
      const { id: resumeId }: { id: number } = await seedResumeUpload(
        applicantBody.id,
      );
      const testBody: ApplicantSubmissionBody =
        applicantSubmissionGenerator.getAPIRequestBody(resumeId);
      const { body }: { body: ApplicantCreateSubmissionResponse } =
        await request(dummyApp)
          .post('/applicants/me/submissions')
          .send(testBody)
          .set('Authorization', `Bearer ${token}`)
          .expect(200);
      expect(Object.keys(body.submission).length).toEqual(33);
      expect(body).toEqual({
        submission: {
          id: expect.any(Number),
          applicantId: applicantBody.id,
          createdAt: expect.any(String),
          ...testBody,
          resumeUpload: { id: resumeId, originalFilename: expect.any(String) },
          openToRemoteMulti: ['in-person', 'hybrid'],
        },
        isFinal: true,
      });
    });

    it('should return 400 error for missing years of experience (yoe)', async () => {
      const randomString = getRandomString();
      const token = await authHelper.getToken(
        `bboberson${randomString}@gmail.com`,
      );
      const { body: applicantBody }: { body: ApplicantResponseBody } =
        await request(dummyApp)
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
      const { id: resumeId }: { id: number } = await seedResumeUpload(
        applicantBody.id,
      );
      const testSubmission =
        applicantSubmissionGenerator.getAPIRequestBody(resumeId);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      delete testSubmission.yoe;
      const { body } = await request(dummyApp)
        .post('/applicants/me/submissions')
        .send({ ...testSubmission })
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
      expect(body).toHaveProperty('title', 'Validation Error');
    });

    it('should return 400 error if request body has invalid openToRelocate value', async () => {
      const randomString = getRandomString();
      const token = await authHelper.getToken(
        `bboberson${randomString}@gmail.com`,
      );
      const { body: applicantBody }: { body: ApplicantResponseBody } =
        await request(dummyApp)
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
      const { id: resumeId } = await seedResumeUpload(applicantBody.id);
      const testSubmission =
        applicantSubmissionGenerator.getAPIRequestBody(resumeId);
      const { body } = await request(dummyApp)
        .post('/applicants/me/submissions')
        .send({ ...testSubmission, openToRelocate: 'idk maybe' })
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
      expect(body).toHaveProperty('title', 'Validation Error');
    });

    it('should return 500 error resumeId is not a valid upload id', async () => {
      const randomString = getRandomString();
      const token = await authHelper.getToken(
        `bboberson${randomString}@gmail.com`,
      );
      const { body: applicantBody }: { body: ApplicantResponseBody } =
        await request(dummyApp)
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
      const { id: resumeId } = await seedResumeUpload(applicantBody.id);
      const testSubmission =
        applicantSubmissionGenerator.getAPIRequestBody(resumeId);
      const { body } = await request(dummyApp)
        .post('/applicants/me/submissions')
        .send({ ...testSubmission, resumeUpload: { id: 9876432 } })
        .set('Authorization', `Bearer ${token}`)
        .expect(500);
      expect(body).toEqual({
        title: 'Error',
        detail: 'Error encountered during request',
        status: 500,
      });
    });
  });

  describe('Cookie authentication', () => {
    it('should create a new applicant submission', async () => {
      const agent = request.agent(dummyApp);
      const { body: applicantBody }: { body: ApplicantResponseBody } =
        await agent.post('/applicants').send({
          name: 'Bob Boberson',
          auth0Id: 'auth0|123456',
          email: 'bboberson@gmail.com',
          preferredContact: 'email',
          searchStatus: 'active',
          acceptedTerms: true,
          acceptedPrivacy: true,
        });
      const { id: resumeId } = await seedResumeUpload(applicantBody.id);
      const testBody: ApplicantSubmissionBody =
        applicantSubmissionGenerator.getAPIRequestBody(resumeId);
      const { body }: { body: ApplicantCreateSubmissionResponse } = await agent
        .post('/applicants/me/submissions')
        .send(testBody)
        .expect(200);
      expect(body.submission).toHaveProperty('id');
    });
  });
});

describe('DELETE /applicants/me', () => {
  describe('Auth0 Integration', () => {
    afterEach(async () => {
      await deleteAuth0Users();
    });
    const app = getApp(
      authService,
      new DummyMonitoringService(prisma),
      new DummyEmailService(new DummySESService(), appConfig),
      new DummyUploadService(prisma, new DummyS3Service(), appConfig),
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
    itif('CI' in process.env)(
      'should delete an existing applicant from Auth0 and create a deletion record when there is nothing in the database',
      async () => {
        const randomString = getRandomString();
        // For the purposes of this test we are creating a user ONLY in Auth0.
        // We would normally only ever be in this situation if someone had
        // logged in with a social account without registering
        const name = 'Bob TheTestUser';
        const email = `bboberson${randomString}@gmail.com`;
        const auth0User = await authService.createUser({
          name,
          email,
        });

        const token = await authHelper.getToken(email, {
          auth0Id: auth0User.user_id,
        });
        if (auth0User.user_id) {
          testUserIDs.push(auth0User.user_id);
        }
        const prismaSpy = jest.spyOn(
          prisma.applicantDeletionRequests,
          'create',
        );
        const auth0Spy = jest.spyOn(authService, 'deleteUsers');

        await request(app)
          .delete('/applicants/me')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        const neverDate = new Date('2000-01-01');

        // expect prisma deletion record to have been created
        expect(prismaSpy).toHaveBeenCalledWith({
          data: {
            email,
            applicantId: 0,
            acceptedTerms: neverDate,
            acceptedPrivacy: neverDate,
            followUpOptIn: false,
          },
        });
        // expect auth0 delete user to have been called
        expect(auth0Spy).toHaveBeenCalledWith(
          auth0User.email,
          auth0User.user_id,
        );
      },
    );
    itif('CI' in process.env)(
      'Should be able to create two applicant deletion records for no-data applicants',
      async () => {
        const name = 'Bob TheTestUser';
        const email = `bboberson${getRandomString()}@gmail.com`;
        const auth0User = await authService.createUser({
          name,
          email,
        });

        const name2 = 'Bob TheOtherTestUser';
        const email2 = `bboberson${getRandomString()}@gmail.com`;
        const auth0User2 = await authService.createUser({
          name: name2,
          email: email2,
        });

        const token = await authHelper.getToken(email, {
          auth0Id: auth0User.user_id,
        });
        const token2 = await authHelper.getToken(email2, {
          auth0Id: auth0User2.user_id,
        });
        if (auth0User.user_id) {
          testUserIDs.push(auth0User.user_id);
        }

        if (auth0User2.user_id) {
          testUserIDs.push(auth0User2.user_id);
        }

        const prismaSpy = jest.spyOn(
          prisma.applicantDeletionRequests,
          'create',
        );

        await request(app)
          .delete('/applicants/me')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        await request(app)
          .delete('/applicants/me')
          .set('Authorization', `Bearer ${token2}`)
          .expect(200);

        const neverDate = new Date('2000-01-01');

        // expect prisma deletion records to have been created
        expect(prismaSpy).toHaveBeenNthCalledWith(1, {
          data: {
            email,
            applicantId: 0,
            acceptedTerms: neverDate,
            acceptedPrivacy: neverDate,
            followUpOptIn: false,
          },
        });
        expect(prismaSpy).toHaveBeenNthCalledWith(2, {
          data: {
            email: email2,
            applicantId: 0,
            acceptedTerms: neverDate,
            acceptedPrivacy: neverDate,
            followUpOptIn: false,
          },
        });
      },
    );
  });
  describe('No Auth0 Integration', () => {
    it('should return 401 for un-authed request', async () => {
      await request(dummyApp).delete('/applicants/me').expect(401);
    });

    it('should return 200 when authenticating with valid token, but applicant does not exist in the database', async () => {
      const token = await authHelper.getToken(
        `bboberson${getRandomString()}@gmail.com`,
      );
      await request(dummyApp)
        .delete('/applicants/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });

    it('should delete applicant from database', async () => {
      const randomString = getRandomString();
      const token = await authHelper.getToken(
        `bboberson${randomString}@gmail.com`,
      );
      await request(dummyApp)
        .post('/applicants')
        .send({
          name: 'Bob Boberson',
          email: `bboberson${randomString}@gmail.com`,
          preferredContact: 'email',
          searchStatus: 'active',
          acceptedTerms: true,
          acceptedPrivacy: true,
        });
      const { body } = await request(dummyApp)
        .delete('/applicants/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(body).toEqual({ id: expect.any(Number) });
    });
  });
});

describe('POST /applicants/me/submissions/draft', () => {
  it('should not allow applicant to save draft submission without a valid cookie or JWT supplied', async () => {
    // Supertest will not save cookies (each request has a separate cookie jar)
    await request(dummyApp).post('/applicants').send({
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
    const { body } = await request(dummyApp)
      .post('/applicants/me/submissions/draft')
      .send(testBody)
      .expect(401);
    expect(body).toHaveProperty('title', 'Unauthorized');
  });

  describe('Cookie based authentication', () => {
    it('should create a new draft applicant submission', async () => {
      const agent = request.agent(dummyApp);
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
      const { body }: { body: ApplicantDraftSubmissionResponseBody } =
        await agent
          .post('/applicants/me/submissions/draft')
          .send(testBody)
          .expect(200);
      expect(body.submission).toHaveProperty('id');
    });

    it('should update an existing draft applicant submission', async () => {
      const agent = request.agent(dummyApp);
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
      const {
        body: draftResp,
      }: { body: ApplicantDraftSubmissionResponseBody } = await agent
        .post('/applicants/me/submissions/draft')
        .send(draftBody)
        .expect(200);
      expect(draftResp.submission).toHaveProperty(
        'resumeUrl',
        'https://bobcanbuild.com/resume',
      );
      const { body }: { body: ApplicantDraftSubmissionResponseBody } =
        await agent
          .post('/applicants/me/submissions/draft')
          .send(draftUpdateBody)
          .expect(200);
      expect(body.submission).toHaveProperty(
        'resumeUrl',
        'https://bobcanREALLYbuild.com/resume',
      );
    });
  });

  describe('JWT based authentication', () => {
    it('should create a new draft applicant submission', async () => {
      const token = await authHelper.getToken('bboberson@gmail.com');
      await request(dummyApp).post('/applicants').send({
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
      const { body }: { body: ApplicantDraftSubmissionResponseBody } =
        await request(dummyApp)
          .post('/applicants/me/submissions/draft')
          .set('Authorization', `Bearer ${token}`)
          .send(testBody)
          .expect(200);
      expect(body.submission).toHaveProperty('id');
    });

    it('should create a new applicant draft submission with a resume included', async () => {
      const randomString = getRandomString();
      const token = await authHelper.getToken(
        `bboberson${randomString}@gmail.com`,
      );
      await request(dummyApp)
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
      // Bob uploads his resume
      const { body: resumeBody }: { body: UploadResponseBody } = await request(
        dummyApp,
      )
        .post('/applicants/me/resume')
        .send({
          originalFilename: 'BobbyBobsBeautifulResume.pdf',
          contentType: 'application/pdf',
        })
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      // Resume upload marked successfully completed
      await request(dummyApp)
        .post(`/applicants/me/uploads/${resumeBody.id}/complete`)
        .send({ status: 'SUCCESS' })
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      const draftBody = { resumeUpload: { id: resumeBody.id } };
      const { body }: { body: ApplicantDraftSubmissionResponseBody } =
        await request(dummyApp)
          .post('/applicants/me/submissions/draft')
          .send(draftBody)
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

      expect(body.submission).toHaveProperty('id');
      expect(body.submission).toHaveProperty('resumeUpload', {
        id: resumeBody.id,
        originalFilename: 'BobbyBobsBeautifulResume.pdf',
      });
    });

    it('should not allow applicant to save draft submission of a non-existent user', async () => {
      const token = await authHelper.getToken('bibbitybobbityboo@gmail.com');
      await request(dummyApp).post('/applicants').send({
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
      const { body }: { body: ApplicantDraftSubmissionResponseBody } =
        await request(dummyApp)
          .post('/applicants/me/submissions/draft')
          .set('Authorization', `Bearer ${token}`)
          .send(testBody)
          .expect(404);
      expect(body).toHaveProperty('title', 'Not Found');
    });
  });
});

describe('GET /applicants/me/submissions', () => {
  describe('JWT authentication', () => {
    it('should get current applicants draft submission with token', async () => {
      // We create draft submission with cookie, get /me/submissions with JWT
      const agent = request.agent(dummyApp);
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
        await request(dummyApp)
          .get('/applicants/me/submissions')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);
      expect(body).toHaveProperty('isFinal', false);
      expect(body).toHaveProperty('submission');
      expect(body.submission).toHaveProperty('id');
    });

    it('should get current applicants draft submission with cookie', async () => {
      const agent = request.agent(dummyApp);
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
      const { body: applicantBody }: { body: ApplicantResponseBody } =
        await request(dummyApp).post('/applicants').send({
          name: 'Bob Boberson',
          email: 'bboberson@gmail.com',
          preferredContact: 'sms',
          searchStatus: 'active',
          acceptedTerms: true,
          acceptedPrivacy: true,
        });
      const { id: resumeId } = await seedResumeUpload(applicantBody.id);
      const testBody: ApplicantDraftSubmissionBody =
        applicantSubmissionGenerator.getAPIRequestBody(resumeId);
      await request(dummyApp)
        .post('/applicants/me/submissions')
        .send(testBody)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      const { body }: { body: ApplicantGetSubmissionResponse } = await request(
        dummyApp,
      )
        .get('/applicants/me/submissions')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(body).toHaveProperty('isFinal', true);
      expect(body).toHaveProperty('submission');
      expect(body.submission).toHaveProperty('id');
    });

    it('should return 401 if no JWT provided', async () => {
      await request(dummyApp).get('/applicants/me/submissions').expect(401);
    });
    it('should return 404 if applicant does not exist', async () => {
      const token = await authHelper.getToken('bboberson@gmail.com');
      const { body } = await request(dummyApp)
        .get('/applicants/me/submissions')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
      expect(body).toHaveProperty('title', 'Not Found');
    });
    it('should return 200 if applicant exists but has no submissions', async () => {
      const token = await authHelper.getToken('bboberson@gmail.com');
      await request(dummyApp).post('/applicants').send({
        name: 'Bob Boberson',
        email: 'bboberson@gmail.com',
        preferredContact: 'sms',
        searchStatus: 'active',
        acceptedTerms: true,
        acceptedPrivacy: true,
      });
      const { body } = await request(dummyApp)
        .get('/applicants/me/submissions')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(body).toHaveProperty('isFinal', false);
      expect(body).toHaveProperty('submission', null);
    });
  });
});

describe('PUT /applicants/me/state', () => {
  it('should return 401 for request with a malformed JWT', async () => {
    await request(dummyApp)
      .put('/applicants/me/state')
      .send({ pause: true })
      .set('Authorization', 'Bearer #!InvalidToken#!')
      .expect(401);
  });
  it('should pause and un-pause an applicants status', async () => {
    const randomString = getRandomString();
    const token = await authHelper.getToken(
      `bboberson${randomString}@gmail.com`,
    );
    await request(dummyApp)
      .post('/applicants')
      .send({
        name: 'Bob Boberson',
        auth0Id: 'auth0|123456',
        email: `bboberson${randomString}@gmail.com`,
        preferredContact: 'email',
        searchStatus: 'active',
        acceptedTerms: true,
        acceptedPrivacy: true,
      })
      .expect(200);
    const { body: pausedBody } = await request(dummyApp)
      .put('/applicants/me/state')
      .send({ pause: true })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(pausedBody).toHaveProperty('id');
    expect(pausedBody).toHaveProperty('isPaused', true);
    const { body: unPausedBody } = await request(dummyApp)
      .put('/applicants/me/state')
      .send({ pause: false })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(unPausedBody).toHaveProperty('id');
    expect(unPausedBody).toHaveProperty('isPaused', false);
  });

  it('should return 404 for non-existent applicant', async () => {
    const token = await authHelper.getToken('bboberson@gmail.com');
    await request(dummyApp)
      .put('/applicants/me/state')
      .send({ pause: true })
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });
});

describe('PUT /applicants/:auth0Id', () => {
  it('should update applicant auth0Id', async () => {
    const token = await authHelper.getToken(undefined, {
      scope: 'another:scope update:tekalo_db_user_auth0_id',
    });
    const { body }: { body: ApplicantResponseBody } = await request(dummyApp)
      .post('/applicants')
      .send({
        name: 'Bob Boberson',
        auth0Id: 'auth0|12345',
        email: `bboberson${getRandomString()}@gmail.com`,
        preferredContact: 'email',
        searchStatus: 'active',
        acceptedTerms: true,
        acceptedPrivacy: true,
      })
      .expect(200);
    const { body: updatedAuthID }: { body: Applicant } = await request(dummyApp)
      .put(`/applicants/${body.auth0Id as string}`)
      .send({ auth0Id: 'google-oauth|12345' })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(updatedAuthID.auth0Id).toEqual('google-oauth|12345');
  });

  it('should return 401 for request made without valid JWT', async () => {
    const { body }: { body: ApplicantResponseBody } = await request(dummyApp)
      .post('/applicants')
      .send({
        name: 'Bob Boberson',
        auth0Id: 'auth0|12345',
        email: `bboberson${getRandomString()}@gmail.com`,
        preferredContact: 'email',
        searchStatus: 'active',
        acceptedTerms: true,
        acceptedPrivacy: true,
      })
      .expect(200);
    await request(dummyApp)
      .put(`/applicants/${body.auth0Id as string}`)
      .send({ auth0Id: 'google-oauth|6789' })
      .expect(401);
  });

  it('should return 404 for non-existent applicant', async () => {
    const token = await authHelper.getToken(undefined, {
      scope: 'another:scope update:tekalo_db_user_auth0_id',
    });
    await request(dummyApp)
      .put('/applicants/999')
      .send({ auth0Id: 'google-oauth|99999' })
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });
});

describe('GET /applicants/me', () => {
  it('should return applicant-level information with a JWT', async () => {
    const randomString = getRandomString();
    const token = await authHelper.getToken(
      `bboberson${randomString}@gmail.com`,
    );
    await request(dummyApp)
      .post('/applicants')
      .send({
        name: 'Bob Boberson',
        email: `bboberson${randomString}@gmail.com`,
        preferredContact: 'sms',
        searchStatus: 'active',
        acceptedTerms: true,
        acceptedPrivacy: true,
      });
    const { body } = await request(dummyApp)
      .get('/applicants/me')
      .set('Authorization', `Bearer ${token}`);
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('name');
    expect(body).toHaveProperty('isPaused');
  });

  it('should return 401 with a cookie but without a JWT', async () => {
    const agent = request.agent(dummyApp);
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

describe('GET /applicants/:id', () => {
  it('should return a 401 status code and NOT allow a user without an admin JWT to retrieve applicant information', async () => {
    const randomString = getRandomString();
    const { body }: { body: ApplicantResponseBody } = await request(dummyApp)
      .post('/applicants')
      .send({
        name: 'Bob Boberson',
        email: `bboberson${randomString}@gmail.com`,
        preferredContact: 'sms',
        searchStatus: 'active',
        acceptedTerms: true,
        acceptedPrivacy: true,
      });
    await request(dummyApp).get(`/applicants/${body.id}`).expect(401);
  });

  it('should return a 200 status code and allow a user with an admin JWT to retrieve applicant information', async () => {
    const randomString = getRandomString();
    const partialTokenOptions: TokenOptions = {
      roles: ['admin'],
    };
    const token = await authHelper.getToken(
      `bboberson${randomString}@gmail.com`,
      partialTokenOptions,
    );
    const { body: body1 }: { body: ApplicantResponseBody } = await request(
      dummyApp,
    )
      .post('/applicants')
      .send({
        name: 'Bob Boberson',
        email: `bboberson${randomString}@gmail.com`,
        preferredContact: 'email',
        searchStatus: 'active',
        acceptedTerms: true,
        acceptedPrivacy: true,
      });
    const { body: body2 } = await request(dummyApp)
      .get(`/applicants/${body1.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    // refer to ApplicantResponseBodySchema
    expect(body2).toHaveProperty('id');
    expect(body2).toHaveProperty('name');
    expect(body2).toHaveProperty('email');
    expect(body2).toHaveProperty('isPaused');
  });
});

describe('DELETE /applicants/:id', () => {
  it('should return a 401 status code and NOT allow a user without an admin JWT to delete applicant information', async () => {
    const randomString = getRandomString();
    const { body }: { body: ApplicantResponseBody } = await request(dummyApp)
      .post('/applicants')
      .send({
        name: 'Bob Boberson',
        email: `bboberson${randomString}@gmail.com`,
        preferredContact: 'sms',
        searchStatus: 'active',
        acceptedTerms: true,
        acceptedPrivacy: true,
      });
    await request(dummyApp).delete(`/applicants/${body.id}`).expect(401);
  });

  it('should return a 200 status code and allow a user with an admin JWT to delete applicant information', async () => {
    const randomString = getRandomString();
    const partialTokenOptions: TokenOptions = {
      roles: ['admin'],
    };
    const token = await authHelper.getToken(
      `bboberson${randomString}@gmail.com`,
      partialTokenOptions,
    );
    const { body: body1 }: { body: ApplicantResponseBody } = await request(
      dummyApp,
    )
      .post('/applicants')
      .send({
        name: 'Bob Boberson',
        email: `bboberson${randomString}@gmail.com`,
        preferredContact: 'email',
        searchStatus: 'active',
        acceptedTerms: true,
        acceptedPrivacy: true,
      });
    await request(dummyApp)
      .delete(`/applicants/${body1.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });
});

describe('POST /applicants/me/resume', () => {
  it('should return 401 without valid JWT or cookie', async () => {
    await request(dummyApp)
      .post('/applicants/me/resume')
      .send({
        originalFilename: 'bob_boberson_resume.pdf',
        contentType: 'application/pdf',
      })
      .expect(401);
  });
  itif('CI' in process.env)('should return an upload url', async () => {
    const randomString = getRandomString();
    const token = await authHelper.getToken(
      `bboberson${randomString}@gmail.com`,
    );

    // create an applicant
    await request(dummyApp)
      .post('/applicants')
      .send({
        name: 'Bob Boberson',
        email: `bboberson${randomString}@gmail.com`,
        preferredContact: 'sms',
        searchStatus: 'active',
        acceptedTerms: true,
        acceptedPrivacy: true,
      });

    const { body } = await request(dummyApp)
      .post('/applicants/me/resume')
      .set('Authorization', `Bearer ${token}`)
      .send({
        originalFilename: 'bob_boberson_resume.pdf',
        contentType: 'application/pdf',
      });

    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('signedLink');
  });
  it('should allow an upload request that includes a content type with charset', async () => {
    const dummyS3Service = new DummyS3Service();
    dummyS3Service.generateSignedUploadUrl = () =>
      Promise.resolve('https://bogus-signed-s3-link.com');
    const dummyUploadService = new DummyUploadService(
      prisma,
      dummyS3Service,
      appConfig,
    );

    const dummyUploadApp = getApp(
      new DummyAuthService(),
      new DummyMonitoringService(prisma),
      new DummyEmailService(new DummySESService(), appConfig),
      dummyUploadService,
      appConfig,
    );

    const randomString = getRandomString();
    const token = await authHelper.getToken(
      `bboberson${randomString}@gmail.com`,
    );

    // create an applicant
    await request(dummyUploadApp)
      .post('/applicants')
      .send({
        name: 'Bob Boberson',
        email: `bboberson${randomString}@gmail.com`,
        preferredContact: 'sms',
        searchStatus: 'active',
        acceptedTerms: true,
        acceptedPrivacy: true,
      });

    const { body } = await request(dummyApp)
      .post('/applicants/me/resume')
      .set('Authorization', `Bearer ${token}`)
      .send({
        originalFilename: 'bob_boberson_resume.pdf',
        contentType: 'application/pdf; charset=utf-8',
      });

    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('signedLink');
  });
  it('should reject an upload request that includes a content type that we do not accept', async () => {
    const dummyS3Service = new DummyS3Service();
    dummyS3Service.generateSignedUploadUrl = () =>
      Promise.resolve('https://bogus-signed-s3-link.com');
    const dummyUploadService = new DummyUploadService(
      prisma,
      dummyS3Service,
      appConfig,
    );
    const dummyUploadApp = getApp(
      new DummyAuthService(),
      new DummyMonitoringService(prisma),
      new DummyEmailService(new DummySESService(), appConfig),
      dummyUploadService,
      appConfig,
    );

    const randomString = getRandomString();
    const token = await authHelper.getToken(
      `bboberson${randomString}@gmail.com`,
    );

    // create an applicant
    await request(dummyUploadApp)
      .post('/applicants')
      .send({
        name: 'Bob Boberson',
        email: `bboberson${randomString}@gmail.com`,
        preferredContact: 'sms',
        searchStatus: 'active',
        acceptedTerms: true,
        acceptedPrivacy: true,
      });

    const { body } = await request(dummyApp)
      .post('/applicants/me/resume')
      .set('Authorization', `Bearer ${token}`)
      .send({
        originalFilename: 'bob_boberson_resume.pdf',
        contentType: 'application/vnd.microsoft.portable-executable',
      })
      .expect(400);

    expect(body).toHaveProperty('detail');
    expect(body).toEqual(
      expect.objectContaining({
        detail: {
          message: 'Invalid input',
          code: 'custom',
          path: ['contentType'],
        },
      }),
    );
  });
});

describe('POST /applicants/me/uploads/:id/state', () => {
  const dummyS3Service = new DummyS3Service();
  dummyS3Service.generateSignedUploadUrl = () =>
    Promise.resolve('https://bogus-signed-s3-link.com');
  const dummyUploadService = new DummyUploadService(
    prisma,
    dummyS3Service,
    appConfig,
  );
  const dummyUploadApp = getApp(
    new DummyAuthService(),
    new DummyMonitoringService(prisma),
    new DummyEmailService(new DummySESService(), appConfig),
    dummyUploadService,
    appConfig,
  );

  it('should return 401 for request with no cookie or JWT', async () => {
    await request(dummyUploadApp)
      .post('/applicants/me/uploads/1/complete')
      .send({ status: 'SUCCESS' })
      .expect(401);
  });

  it('should successfully update upload status', async () => {
    const randomString = getRandomString();
    const token = await authHelper.getToken(
      `bboberson${randomString}@gmail.com`,
    );
    const filename = 'myResume.pdf';
    await request(dummyUploadApp)
      .post('/applicants')
      .send({
        name: 'Bob Boberson',
        email: `bboberson${randomString}@gmail.com`,
        preferredContact: 'sms',
        searchStatus: 'active',
        acceptedTerms: true,
        acceptedPrivacy: true,
      })
      .set('Authorization', `Bearer ${token}`);

    const { body: uploadBody }: { body: UploadResponseBody } = await request(
      dummyUploadApp,
    )
      .post('/applicants/me/resume')
      .send({
        originalFilename: filename,
        contentType: 'application/pdf',
      })
      .set('Authorization', `Bearer ${token}`);

    const { body: uploadCompleteBody }: { body: UploadStateResponseBody } =
      await request(dummyUploadApp)
        .post(`/applicants/me/uploads/${uploadBody.id}/complete`)
        .send({ status: 'SUCCESS' })
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    expect(uploadCompleteBody).toHaveProperty('id');
  });

  it('should return 400 if upload does not belong to applicant', async () => {
    const bobRandomString = getRandomString();
    const peteRandomString = getRandomString();
    const bobToken = await authHelper.getToken(
      `bboberson${bobRandomString}@gmail.com`,
      { auth0Id: 'auth0|12345' },
    );
    const peteToken = await authHelper.getToken(
      `pdavidson${peteRandomString}@gmail.com`,
      { auth0Id: 'auth0|678999' },
    );

    const filename = 'myResume.pdf';
    // Create Bob
    await request(dummyUploadApp)
      .post('/applicants')
      .send({
        name: 'Bob Boberson',
        email: `bboberson${bobRandomString}@gmail.com`,
        preferredContact: 'sms',
        searchStatus: 'active',
        acceptedTerms: true,
        acceptedPrivacy: true,
      })
      .set('Authorization', `Bearer ${bobToken}`)
      .expect(200);

    // Create Pete
    await request(dummyUploadApp)
      .post('/applicants')
      .send({
        name: 'Dave Davidson',
        email: `pdavidson${peteRandomString}@gmail.com`,
        preferredContact: 'sms',
        searchStatus: 'active',
        acceptedTerms: true,
        acceptedPrivacy: true,
      })
      .set('Authorization', `Bearer ${peteToken}`)
      .expect(200);

    // Bob uploads his resume
    await request(dummyUploadApp)
      .post('/applicants/me/resume')
      .send({
        originalFilename: filename,
        contentType: 'application/pdf',
      })
      .set('Authorization', `Bearer ${bobToken}`)
      .expect(200);

    // Pete uploads his resume
    const { body: davidUploadBody }: { body: UploadResponseBody } =
      await request(dummyUploadApp)
        .post('/applicants/me/resume')
        .send({
          originalFilename: filename,
          contentType: 'application/pdf',
        })
        .set('Authorization', `Bearer ${peteToken}`)
        .expect(200);

    // Bob tries to mark Pete's resume complete
    await request(dummyUploadApp)
      .post(`/applicants/me/uploads/${davidUploadBody.id}/complete`)
      .send({ status: 'SUCCESS' })
      .set('Authorization', `Bearer ${bobToken}`)
      .expect(400);
  });

  it('should return 400 when attempting to "complete" an already successful upload', async () => {
    const randomString = getRandomString();
    const token = await authHelper.getToken(
      `bboberson${randomString}@gmail.com`,
    );
    const filename = 'myResume.pdf';
    await request(dummyUploadApp)
      .post('/applicants')
      .send({
        name: 'Bob Boberson',
        email: `bboberson${randomString}@gmail.com`,
        preferredContact: 'sms',
        searchStatus: 'active',
        acceptedTerms: true,
        acceptedPrivacy: true,
      })
      .set('Authorization', `Bearer ${token}`);

    const { body: uploadBody }: { body: UploadResponseBody } = await request(
      dummyUploadApp,
    )
      .post('/applicants/me/resume')
      .send({
        originalFilename: filename,
        contentType: 'application/pdf',
      })
      .set('Authorization', `Bearer ${token}`);

    await request(dummyUploadApp)
      .post(`/applicants/me/uploads/${uploadBody.id}/complete`)
      .send({ status: 'SUCCESS' })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    await request(dummyUploadApp)
      .post(`/applicants/me/uploads/${uploadBody.id}/complete`)
      .send({ status: 'FAILURE' })
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
  });
});

describe('GET /applicants/:id/resume', () => {
  it('should return 401 if JWT does not contain matchmaker role', async () => {
    const randomString = getRandomString();
    const bobToken = await authHelper.getToken(
      `bboberson${randomString}@gmail.com`,
      { roles: ['notAMatchmaker'] },
    );
    await request(dummyApp)
      .post('/applicants')
      .send({
        name: 'Bob Boberson',
        email: `bboberson${randomString}@gmail.com`,
        preferredContact: 'sms',
        searchStatus: 'active',
        acceptedTerms: true,
        acceptedPrivacy: true,
      });

    const { body: resumeBody }: { body: UploadResponseBody } = await request(
      dummyApp,
    )
      .post('/applicants/me/resume')
      .set('Authorization', `Bearer ${bobToken}`)
      .send({
        originalFilename: 'bob_boberson_resume.pdf',
        contentType: 'application/pdf',
      })
      .expect(200);

    await request(dummyApp)
      .get(`/applicants/${resumeBody.id}/resume`)
      .set('Authorization', `Bearer ${bobToken}`)
      .expect(401);
  });

  it('should successfully get an applicants most recently uploaded presigned resume download url', async () => {
    const dummyS3Service = new DummyS3Service();
    dummyS3Service.generateSignedDownloadUrl = () =>
      Promise.resolve('https://bogus-upload-signed-s3-link.com');
    dummyS3Service.generateSignedUploadUrl = () =>
      Promise.resolve('https://bogus-download-signed-s3-link.com');
    const dummyUploadService = new DummyUploadService(
      prisma,
      dummyS3Service,
      appConfig,
    );
    const dummyS3ServiceApp = getDummyApp(
      undefined,
      undefined,
      undefined,
      dummyUploadService,
    );

    const randomString = getRandomString();
    const bobToken = await authHelper.getToken(
      `bboberson${randomString}@gmail.com`,
      { roles: ['matchmaker'] },
    );
    const { body: applicantBody }: { body: ApplicantResponseBody } =
      await request(dummyS3ServiceApp)
        .post('/applicants')
        .send({
          name: 'Bob Boberson',
          email: `bboberson${randomString}@gmail.com`,
          preferredContact: 'sms',
          searchStatus: 'active',
          acceptedTerms: true,
          acceptedPrivacy: true,
        });

    // Bob uploads his resume
    const { body: uploadBodyV1 }: { body: UploadResponseBody } = await request(
      dummyS3ServiceApp,
    )
      .post('/applicants/me/resume')
      .set('Authorization', `Bearer ${bobToken}`)
      .send({
        originalFilename: 'bob_boberson_resume.pdf',
        contentType: 'application/pdf',
      })
      .expect(200);

    // Bob's first resume is marked successfully uploaded
    await request(dummyS3ServiceApp)
      .post(`/applicants/me/uploads/${uploadBodyV1.id}/complete`)
      .set('Authorization', `Bearer ${bobToken}`)
      .send({ status: 'SUCCESS' })
      .expect(200);

    // Bob realizes it was the wrong file, and uploads another resume
    const { body: uploadBodyV2 }: { body: UploadResponseBody } = await request(
      dummyS3ServiceApp,
    )
      .post('/applicants/me/resume')
      .set('Authorization', `Bearer ${bobToken}`)
      .send({
        originalFilename: 'bob_boberson_resume_v2.pdf',
        contentType: 'application/pdf',
      })
      .expect(200);

    // Bob's second resume is marked successfully uploaded
    await request(dummyS3ServiceApp)
      .post(`/applicants/me/uploads/${uploadBodyV2.id}/complete`)
      .set('Authorization', `Bearer ${bobToken}`)
      .send({ status: 'SUCCESS' })
      .expect(200);

    // Bob submits submission with V2 resume
    const testSubmission = applicantSubmissionGenerator.getAPIRequestBody(
      uploadBodyV2.id,
    );
    await request(dummyS3ServiceApp)
      .post('/applicants/me/submissions')
      .set('Authorization', `Bearer ${bobToken}`)
      .send(testSubmission)
      .expect(200);

    const { body: resumeBody } = await request(dummyS3ServiceApp)
      .get(`/applicants/${applicantBody.id}/resume`)
      .set('Authorization', `Bearer ${bobToken}`)
      .expect(200);
    expect(resumeBody).toHaveProperty('id', uploadBodyV2.id);
  });

  itif('CI' in process.env)('should return a resume download url', async () => {
    const randomString = getRandomString();
    const token = await authHelper.getToken(
      `bboberson${randomString}@gmail.com`,
      { roles: ['matchmaker'] },
    );

    // create an applicant
    const { body: applicantBody }: { body: ApplicantResponseBody } =
      await request(dummyApp)
        .post('/applicants')
        .send({
          name: 'Bob Boberson',
          email: `bboberson${randomString}@gmail.com`,
          preferredContact: 'sms',
          searchStatus: 'active',
          acceptedTerms: true,
          acceptedPrivacy: true,
        });

    const { body: resume }: { body: UploadResponseBody } = await request(
      dummyApp,
    )
      .post('/applicants/me/resume')
      .set('Authorization', `Bearer ${token}`)
      .send({
        originalFilename: 'bob_boberson_resume.pdf',
        contentType: 'application/pdf',
      })
      .expect(200);

    await request(dummyApp)
      .post(`/applicants/me/uploads/${resume.id}/complete`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'SUCCESS' })
      .expect(200);

    const { body } = await request(dummyApp)
      .get(`/applicants/${applicantBody.id}/resume`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        originalFilename: 'bob_boberson_resume.pdf',
        contentType: 'application/pdf',
      });

    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('signedLink');
  });

  it('should return 404 for a resume that does not exist', async () => {
    const bobToken = await authHelper.getToken(
      `bboberson${getRandomString()}@gmail.com`,
      { roles: ['matchmaker'] },
    );
    await request(dummyApp)
      .get('/applicants/123456/resume')
      .set('Authorization', `Bearer ${bobToken}`)
      .expect(404);
  });
});
