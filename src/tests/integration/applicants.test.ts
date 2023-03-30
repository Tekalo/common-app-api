import request from 'supertest';
import getApp from '@App/app.js';
import { ApplicantResponseBody } from '@App/resources/types/applicants.js';
import { itif, getRandomString } from '@App/tests/util/helpers.js';
import prisma from '@App/resources/client.js';

import AuthService from '@App/services/AuthService.js';
import DummyAuthService from '../fixtures/DummyAuthService.js';

let testUserID: string;
const authService = new AuthService();

afterEach(async () => {
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
      'should throw error if DB user creation succeeds but Auth0 user creation fails',
      async () => {
        // Make user in DB only
        await request(app).post('/applicants').query('auth0=false').send({
          name: 'Bob Boberson',
          email: 'bboberson@gmail.com',
          preferredContact: 'sms',
          searchStatus: 'active',
        });
        // User DB Creation should fail (dupe) auth0 should succeed but we want to not complete the transaction
        await request(app).post('/applicants').query('auth0=false').send({
          name: 'Bob Boberson',
          email: 'bboberson@gmail.com',
          preferredContact: 'sms',
          searchStatus: 'active',
        });
        // .expect(409);
        // if (body.auth0Id) {
        //   testUserID = body.auth0Id;
        // }
        // expect(body).toHaveProperty('auth0Id');
        // expect(body).toHaveProperty('email');
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

describe('DELETE /applicants', () => {
  it('should delete an existing applicant from database and Auth0', async () => {
    // TODO check for auth0?
    // Create applicant to delete
    const { body }: { body: ApplicantResponseBody } = await request(app)
      .post('/applicants')
      .query('auth0=false')
      .send({
        name: 'Bob Boberson',
        email: 'bboberson@gmail.com',
        preferredContact: 'sms',
        searchStatus: 'active',
      });
    const { id } = body;
    await request(app).delete(`/applicants/${id}`).expect(200);
  });
  it('should return 400 for non-existent applicant id', async () => {
    const { body } = await request(app).delete('/applicants/99999').expect(400);
    expect(body).toHaveProperty('title', 'Applicant Deletion Error');
  });
});
