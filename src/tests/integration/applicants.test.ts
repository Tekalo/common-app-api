import request from 'supertest';
import app from '@App/app.js';
import CappAuth0Client from '@App/services/CappAuth0Client.js';
import { ApplicantResponseBody } from '@App/resources/types/applicants.js';
import itif from '@App/tests/util/helpers.js';

let testUserID: string;
const cappAuth0 = new CappAuth0Client();

afterAll(async () => {
  if (testUserID) {
    const auth0Client = cappAuth0.getClient();
    await auth0Client.deleteUser({ id: testUserID });
  }
});

describe('POST /applicants', () => {
  it('should create a new applicant only in database', async () => {
    // TODO: Comment back in when we add in DB logic
    const { body } = await request(app)
      .post('/applicants')
      .send({
        name: 'Bob Boberson',
        email: 'bboberson@gmail.com',
        preferredContact: 'email',
      })
      .query('auth0=false')
      .expect(200);
    expect(body).toHaveProperty('email', 'bboberson@gmail.com');
  });
  it('should throw 400 error for missing email', async () => {
    const { body } = await request(app)
      .post('/applicants')
      .send({ name: 'Bob Boberson' })
      .expect(400);
    expect(body).toHaveProperty('title', 'Zod Validation Error');
  });
  test('Should throw error if request body has invalid preferred contact', async () => {
    const { body } = await request(app)
      .post('/applicants')
      .send({
        name: 'Bob Boberson',
        email: 'bboberson@gmail.com',
        preferredContact: 'text me please',
      })
      .expect(400);
    expect(body).toHaveProperty('title', 'Zod Validation Error');
  });
  describe('Auth0 Integration', () => {
    itif('CI' in process.env)(
      'should create a new applicant and store in Auth0',
      async () => {
        const { body }: { body: ApplicantResponseBody } = await request(app)
          .post('/applicants')
          .send({ name: 'Bob Boberson', email: 'bboberson@gmail.com' })
          .expect(200);
        if (body.auth0Id) {
          testUserID = body.auth0Id;
        }
        expect(body).toHaveProperty('auth0Id');
        expect(body).toHaveProperty('email');
      },
    );
    // This test depends on the previous one to create Bob Boberson
    itif('CI' in process.env)(
      'should throw 409 if user already exists',
      async () => {
        const { body } = await request(app)
          .post('/applicants')
          .send({ name: 'Bob Boberson', email: 'bboberson@gmail.com' })
          .expect(409);
        expect(body).toHaveProperty('title', 'User Creation Error');
        expect(body).toHaveProperty('detail', 'User already exists');
      },
    );
  });
});
