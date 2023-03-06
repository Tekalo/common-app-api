import request from 'supertest';
import app from '@App/app.js';

beforeAll(async () => {});

afterAll(async () => {});

// TODO Fix this test for Auth0 testing
describe('POST /applicants', () => {
  test('should create a new applicant and store in Auth0', async () => {
    const { body } = await request(app)
      .post('/applicants')
      .send({ name: 'Bob Boberson', email: 'bboberson@gmail.com' })
      .expect(200);
    expect(body).toEqual({ success: true });
  });
  test('should throw 400 error for missing email', async () => {
    const { body } = await request(app)
      .post('/applicants')
      .send({ name: 'Bob Boberson' })
      .expect(400);
    expect(body).toHaveProperty('title','Zod Validation Error')
  });
  test('should throw 409 if user already exists', async () => {
    // const { body } = await request(app)
    //   .post('/applicants')
    //   .send({ name: 'Bob Boberson' })
    //   .expect(409);
    // expect(body).toHaveProperty('title','Bad Request')
    // expect(body).toHaveProperty('detail','User exists')
  });
});
