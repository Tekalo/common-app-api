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
import DummyMonitoringService from '../fixtures/DummyMonitoringService.js';

let testUserID: string;
const authService = new AuthService();

afterEach(async () => {
  await prisma.applicantDraftSubmission.deleteMany();
  await prisma.applicantSubmission.deleteMany();
  await prisma.applicant.deleteMany();
  await prisma.applicantDeletionRequests.deleteMany();
});

// describe('POST /applicants', () => {
//   describe('No Auth0', () => {
//     const dummyAuthApp = getApp(
//       new DummyAuthService(),
//       new DummyMonitoringService(),
//     );
//     it('should create a new applicant only in database', async () => {
//       const { body } = await request(dummyAuthApp)
//         .post('/applicants')
//         .send({
//           name: 'Bob Boberson',
//           pronoun: 'he/his',
//           email: `bboberson${getRandomString()}@gmail.com`,
//           preferredContact: 'email',
//           searchStatus: 'active',
//           acceptedTerms: true,
//           acceptedPrivacy: true,
//         })
//         .expect(200);
//       expect(body).toHaveProperty('id');
//     });
//     it('should throw 400 error for missing email', async () => {
//       const { body } = await request(dummyAuthApp)
//         .post('/applicants')
//         .send({ name: 'Bob Boberson' })
//         .expect(400);
//       expect(body).toHaveProperty('title', 'Validation Error');
//     });
//     it('should throw 400 error if acceptedPrivacy false', async () => {
//       const { body } = await request(dummyAuthApp)
//         .post('/applicants')
//         .send({
//           name: 'Bob Boberson',
//           email: `bboberson${getRandomString()}@gmail.com`,
//           preferredContact: 'sms',
//           searchStatus: 'active',
//           acceptedTerms: true,
//           acceptedPrivacy: false,
//         })
//         .expect(400);
//       expect(body).toHaveProperty('title', 'Validation Error');
//     });
//     it('should throw 400 error when creating a duplicate applicant in database', async () => {
//       await request(dummyAuthApp).post('/applicants').send({
//         name: 'Bob Boberson',
//         email: 'bboberson123@gmail.com',
//         preferredContact: 'sms',
//         searchStatus: 'active',
//         acceptedTerms: true,
//         acceptedPrivacy: true,
//       });
//       const { body } = await request(dummyAuthApp)
//         .post('/applicants')
//         .send({
//           name: 'Bob Boberson',
//           email: 'bboberson123@gmail.com',
//           preferredContact: 'sms',
//           searchStatus: 'active',
//           acceptedTerms: true,
//           acceptedPrivacy: true,
//         })
//         .expect(400);
//       expect(body).toHaveProperty('title', 'User Creation Error');
//     });
//     test('Should throw error if request body has invalid preferred contact', async () => {
//       const { body } = await request(dummyAuthApp)
//         .post('/applicants')
//         .send({
//           name: 'Bob Boberson',
//           email: `bboberson${getRandomString()}@gmail.com`,
//           preferredContact: 'text me please',
//           searchStatus: 'active',
//           acceptedTerms: true,
//           acceptedPrivacy: true,
//         })
//         .expect(400);
//       expect(body).toHaveProperty('title', 'Validation Error');
//     });
//   });

//   describe('Auth0 Integration', () => {
//     const app = getApp(authService, new DummyMonitoringService());
//     afterEach(async () => {
//       if (testUserID) {
//         const auth0Service = authService.getClient();
//         await auth0Service.deleteUser({ id: testUserID });
//       }
//     });
//     itif('CI' in process.env)(
//       'should create a new applicant and store in Auth0',
//       async () => {
//         const { body }: { body: ApplicantResponseBody } = await request(app)
//           .post('/applicants')
//           .send({
//             name: 'Bob Boberson',
//             email: `bboberson${getRandomString()}@gmail.com`,
//             preferredContact: 'sms',
//             searchStatus: 'active',
//             acceptedTerms: true,
//             acceptedPrivacy: true,
//           })
//           .expect(200);
//         if (body.auth0Id) {
//           testUserID = body.auth0Id;
//         }
//         expect(body).toHaveProperty('auth0Id');
//         expect(body).toHaveProperty('email');
//       },
//     );
//     itif('CI' in process.env)(
//       'should throw 409 if user already exists in Auth0',
//       async () => {
//         const { body }: { body: ApplicantResponseBody } = await request(app)
//           .post('/applicants')
//           .send({
//             name: 'Bob Boberson',
//             email: 'bboberson333@gmail.com',
//             preferredContact: 'sms',
//             searchStatus: 'active',
//             acceptedTerms: true,
//             acceptedPrivacy: true,
//           });
//         if (body.auth0Id) {
//           testUserID = body.auth0Id;
//         }
//         const { body: conflictBody } = await request(app)
//           .post('/applicants')
//           .send({
//             name: 'Bob Boberson',
//             auth0Id: 'auth0|123456',
//             email: 'bboberson333@gmail.com',
//             preferredContact: 'sms',
//             searchStatus: 'active',
//             acceptedTerms: true,
//             acceptedPrivacy: true,
//           })
//           .expect(409);
//         expect(conflictBody).toHaveProperty('title', 'User Creation Error');
//         expect(conflictBody).toHaveProperty('detail', 'User already exists');
//       },
//     );
//   });
// });

// describe('POST /applicants/:id/submissions', () => {
//   const dummyAuthApp = getApp(
//     new DummyAuthService(),
//     new DummyMonitoringService(),
//   );
//   it('should create a new applicant submission', async () => {
//     const testApplicantResp = await request(dummyAuthApp)
//       .post('/applicants')
//       .send({
//         name: 'Bob Boberson',
//         auth0Id: 'auth0|123456',
//         email: `bboberson${getRandomString()}@gmail.com`,
//         preferredContact: 'email',
//         searchStatus: 'active',
//         acceptedTerms: true,
//         acceptedPrivacy: true,
//       });
//     const { id }: { id: number } = testApplicantResp.body;
//     const testBody: ApplicantSubmissionBody =
//       applicantSubmissionGenerator.getAPIRequestBody();
//     const { body } = await request(dummyAuthApp)
//       .post(`/applicants/${id}/submissions`)
//       .send(testBody)
//       .expect(200);
//     expect(body).toHaveProperty('id');
//   });

//   it('should throw 400 error for missing years of experience (yoe)', async () => {
//     const testSubmission = applicantSubmissionGenerator.getAPIRequestBody();
//     // eslint-disable-next-line @typescript-eslint/ban-ts-comment
//     // @ts-ignore
//     delete testSubmission.yoe;
//     const { body } = await request(dummyAuthApp)
//       .post('/applicants/1/submissions')
//       .send({ ...testSubmission })
//       .expect(400);
//     expect(body).toHaveProperty('title', 'Validation Error');
//   });

//   it('should throw error if request body has invalid openToRelocate value', async () => {
//     const testSubmission = applicantSubmissionGenerator.getAPIRequestBody();
//     const { body } = await request(dummyAuthApp)
//       .post('/applicants/1/submissions')
//       .send({ ...testSubmission, openToRelocate: 'idk maybe' })
//       .expect(400);
//     expect(body).toHaveProperty('title', 'Validation Error');
//   });
// });

// describe('DELETE /applicants', () => {
//   describe('Auth0 Integration', () => {
//     afterEach(async () => {
//       if (testUserID) {
//         const auth0Service = authService.getClient();
//         await auth0Service.deleteUser({ id: testUserID });
//       }
//     });
//     const app = getApp(authService, new DummyMonitoringService());
//     itif('CI' in process.env)(
//       'should delete an existing applicant from Auth0 and from database',
//       async () => {
//         const { body }: { body: ApplicantResponseBody } = await request(app)
//           .post('/applicants')
//           .send({
//             name: 'Bob Boberson',
//             email: `bboberson${getRandomString()}@gmail.com`,
//             preferredContact: 'email',
//             searchStatus: 'active',
//             acceptedTerms: true,
//             acceptedPrivacy: true,
//           });
//         if (body.auth0Id) {
//           testUserID = body.auth0Id;
//         }
//         const { id } = body;
//         await request(app).delete(`/applicants/${id}`).expect(200);
//       },
//     );
//   });
//   describe('No Auth0 Integration', () => {
//     const appNoAuth = getApp(
//       new DummyAuthService(),
//       new DummyMonitoringService(),
//     );

//     it('should return 400 for non-existent applicant id', async () => {
//       const { body } = await request(appNoAuth)
//         .delete('/applicants/99999')
//         .expect(400);
//       expect(body).toHaveProperty('title', 'Applicant Deletion Error');
//     });

//     it('should delete applicant from database', async () => {
//       const { body }: { body: ApplicantResponseBody } = await request(appNoAuth)
//         .post('/applicants')
//         .send({
//           name: 'Bob Boberson',
//           email: `bboberson${getRandomString()}@gmail.com`,
//           preferredContact: 'email',
//           searchStatus: 'active',
//           acceptedTerms: true,
//           acceptedPrivacy: true,
//         });
//       if (body.auth0Id) {
//         testUserID = body.auth0Id;
//       }
//       const { id } = body;
//       await request(appNoAuth).delete(`/applicants/${id}`).expect(200);
//     });
//   });
// });

// describe('POST /applicants/:id/submissions/draft', () => {
//   const dummyAuthApp = getApp(
//     new DummyAuthService(),
//     new DummyMonitoringService(),
//   );
//   it('should create a new draft applicant submission', async () => {
//     const testApplicantResp = await request(dummyAuthApp)
//       .post('/applicants')
//       .send({
//         name: 'Bob Boberson',
//         email: 'bboberson@gmail.com',
//         preferredContact: 'sms',
//         searchStatus: 'active',
//         acceptedTerms: true,
//         acceptedPrivacy: true,
//       });
//     const { id }: { id: number } = testApplicantResp.body;
//     const testBody: ApplicantDraftSubmissionBody = {
//       resumeUrl: 'https://bobcanbuild.com',
//     };
//     const { body } = await request(dummyAuthApp)
//       .post(`/applicants/${id}/submissions/draft`)
//       .send(testBody)
//       .expect(200);
//     expect(body).toHaveProperty('id');
//   });

//   it('should update an existing draft applicant submission', async () => {
//     const testApplicantResp = await request(dummyAuthApp)
//       .post('/applicants')
//       .send({
//         name: 'Bob Boberson',
//         email: 'bboberson@gmail.com',
//         preferredContact: 'sms',
//         searchStatus: 'active',
//         acceptedTerms: true,
//         acceptedPrivacy: true,
//       });
//     const { id }: { id: number } = testApplicantResp.body;
//     const draftBody: ApplicantDraftSubmissionBody = {
//       resumeUrl: 'https://bobcanbuild.com',
//     };
//     const draftUpdateBody: ApplicantDraftSubmissionBody = {
//       resumeUrl: 'https://bobcanREALLYbuild.org',
//     };
//     const { body: draftResp } = await request(dummyAuthApp)
//       .post(`/applicants/${id}/submissions/draft`)
//       .send(draftBody)
//       .expect(200);
//     expect(draftResp).toHaveProperty('resumeUrl', 'https://bobcanbuild.com');
//     const { body } = await request(dummyAuthApp)
//       .post(`/applicants/${id}/submissions/draft`)
//       .send(draftUpdateBody)
//       .expect(200);
//     expect(body).toHaveProperty('resumeUrl', 'https://bobcanREALLYbuild.org');
//   });
// });

describe('GET /applicants/me/submissions', () => {
  const dummyAuthApp = getApp(
    new DummyAuthService(),
    new DummyMonitoringService(),
  );
  it('should get current applicants draft submission when provided JWT', async () => {
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
    await request(dummyAuthApp)
      .post(`/applicants/${id}/submissions/draft`)
      .send(testBody)
      .expect(200);
    const { body } = await request(dummyAuthApp)
      .get('/applicants/me/submissions')
      .set(
        'Authorization',
        'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJUZXN0IEpXVCAiLCJpYXQiOjE2ODExNTg1NTUsImV4cCI6MTcxMjY5NDU1NSwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoianJvY2tldEBleGFtcGxlLmNvbSIsImVtYWlsIjoiYmJvYmVyc29uQGdtYWlsLmNvbSJ9.1MhyJbU-6BDqPPJvoYtAyxhgmWlkuahRjzQO7_bT5rw',
      )
      .expect(200);
    expect(body).toHaveProperty('isFinal', false);
    expect(body).toHaveProperty('submission');
    expect(body.submission).toHaveProperty('id');
  });

  // should use either session cookie OR Authorization header
  it('should get current applicants final submission when provided JWT', async () => {
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
    await request(dummyAuthApp)
      .post(`/applicants/${id}/submissions`)
      .send(testBody)
      .expect(200);
    const { body } = await request(dummyAuthApp)
      .get('/applicants/me/submissions')
      .set(
        'Authorization',
        'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJUZXN0IEpXVCAiLCJpYXQiOjE2ODExNTg1NTUsImV4cCI6MTcxMjY5NDU1NSwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoianJvY2tldEBleGFtcGxlLmNvbSIsImVtYWlsIjoiYmJvYmVyc29uQGdtYWlsLmNvbSJ9.1MhyJbU-6BDqPPJvoYtAyxhgmWlkuahRjzQO7_bT5rw',
      )
      .expect(200);
    expect(body).toHaveProperty('isFinal', true);
    expect(body).toHaveProperty('submission');
    expect(body.submission).toHaveProperty('id');
  });

  // should use either session cookie OR Authorization header
  it('should get current applicants draft submission when provided session cookie', async () => {});

  // Someone has signed up using Auth0, has a valid JWT, but has not yet registered in the app
  it('should return 404 if no applicant found in the database', async () => {
    const { body } = await request(dummyAuthApp)
      .get('/applicants/me/submissions')
      .set(
        'Authorization',
        'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJUZXN0IEpXVCIsImlhdCI6MTY4MTIxNzM3NSwiZXhwIjoxNzEyNzUzMzc1LCJhdWQiOiJ3d3cuZXhhbXBsZS5jb20iLCJzdWIiOiJ1bmtub3duIHVzZXIiLCJFbWFpbCI6InVua25vd25AZW1haWwuY29tIn0.EEsMjr-trd8h58MFVBMJVr6MD9SFfyl-hn91hQc1GDg',
      )
      .expect(404);
  });

  it('should return null for both values if applicant exists but has no submissions', async () => {
    const { body } = await request(dummyAuthApp)
      .get('/applicants/me/submissions')
      .set(
        'Authorization',
        'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJUZXN0IEpXVCIsImlhdCI6MTY4MTIxNzM3NSwiZXhwIjoxNzEyNzUzMzc1LCJhdWQiOiJ3d3cuZXhhbXBsZS5jb20iLCJzdWIiOiJ1bmtub3duIHVzZXIiLCJFbWFpbCI6InVua25vd25AZW1haWwuY29tIn0.EEsMjr-trd8h58MFVBMJVr6MD9SFfyl-hn91hQc1GDg',
      )
      .expect(200);
    expect(body).toHaveProperty('isFinal', null);
    expect(body).toHaveProperty('submission', null);
  });
});
