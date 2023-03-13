import request from 'supertest';
import app from '@App/app.js';
import AuthService from '@App/services/AuthService.js';
import { ApplicantResponseBody } from '@App/resources/types/applicants.js';
import itif from '@App/tests/util/helpers.js';

let testUserID: string;
const authService = new AuthService();

afterEach(async () => {
  if (testUserID) {
    const auth0Service = authService.getClient();
    await auth0Service.deleteUser({ id: testUserID });
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
    expect(body).toHaveProperty('title', 'Validation Error');
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
      'should throw 409 if user already exists',
      async () => {
        const { body }: { body: ApplicantResponseBody } = await request(app)
          .post('/applicants')
          .send({
            name: 'Bob Boberson',
            email: 'bboberson@gmail.com',
            preferredContact: 'sms',
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
          })
          .expect(409);
        expect(conflictBody).toHaveProperty('title', 'User Creation Error');
        expect(conflictBody).toHaveProperty('detail', 'User already exists');
      },
    );
  });
});
