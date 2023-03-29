import request from 'supertest';
import app from '@App/app.js';
import { ApplicantResponseBody } from '@App/resources/types/applicants.js';
import { itif, getRandomString } from '@App/tests/util/helpers.js';
import prisma from '@App/resources/client.js';
import applicantRoutes from '@App/routes/applicants.js';

import { jest } from '@jest/globals';
import { User } from 'auth0';
import AuthService from '../../services/AuthService.js';

let testUserID: string;
const authService = new AuthService();

afterEach(async () => {
  if (testUserID) {
    const auth0Service = authService.getClient();
    await auth0Service.deleteUser({ id: testUserID });
  }
  await prisma.applicant.deleteMany();
});

const mockUser = {} as User;
jest
  .spyOn(AuthService.prototype, 'createUser')
  .mockImplementation(() => Promise.resolve(mockUser));

describe('POST /applicants', () => {
  it('should create a new applicant only in database', async () => {
    app.use('/applicants', applicantRoutes(new AuthService())); // override?
    const { body } = await request(app)
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
        email: `bboberson${getRandomString()}@gmail.com`,
        preferredContact: 'sms',
        searchStatus: 'active',
        acceptedTerms: true,
        acceptedPrivacy: false,
      })
      .expect(400);
    expect(body).toHaveProperty('title', 'Validation Error');
  });
  it('should throw 400 error when creating a duplicate applicant', async () => {
    await request(app).post('/applicants').send({
      name: 'Bob Boberson',
      email: 'bboberson123@gmail.com',
      preferredContact: 'sms',
      searchStatus: 'active',
      acceptedTerms: true,
      acceptedPrivacy: true,
    });
    const { body } = await request(app)
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
    const { body } = await request(app)
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

  describe('Auth0 Integration', () => {
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
