import request from 'supertest';
import app from '@App/app.js';
import CappAuth0Client from '@App/services/CappAuth0Client.js';
import { ApplicantResponse } from '@App/resources/types/apiResponses.js';

let testUserID: string;
const cappAuth0 = new CappAuth0Client();

beforeAll(async () => {});

afterAll(async () => {
  if ('CI' in process.env && testUserID) {
    const auth0Client = cappAuth0.getClient();
    await auth0Client.deleteUser({ id: testUserID });
  }
});

const itif = (condition: boolean) => (condition ? it : it.skip);

// TODO Fix this test for Auth0 testing
describe('POST /applicants', () => {
  it('should create a new applicant', async () => {
    const { body } = await request(app)
      .post('/applicants')
      .send({ name: 'Bob Boberson', email: 'bboberson@gmail.com' })
      .query('auth0=false')
      .expect(200);
    expect(body).toHaveProperty('email', 'bboberson@gmail.com');
  });
  itif('CI' in process.env)(
    'should create a new applicant and store in Auth0',
    async () => {
      const { body }: { body: ApplicantResponse } = await request(app)
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
  test('should throw 409 if user already exists', async () => {
    const { body } = await request(app)
      .post('/applicants')
      .send({ name: 'Bob Boberson', email: 'bboberson@gmail.com' })
      .expect(409);
    expect(body).toHaveProperty('title', 'User Creation Error');
    expect(body).toHaveProperty('detail', 'User already exists');
  });
  test('should throw 400 error for missing email', async () => {
    const { body } = await request(app)
      .post('/applicants')
      .send({ name: 'Bob Boberson' })
      .expect(400);
    expect(body).toHaveProperty('title', 'Zod Validation Error');
  });
});
