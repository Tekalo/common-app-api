import request from 'supertest';
import app from '@App/app.js';

beforeAll(async () => {});

afterAll(async () => {});

describe('POST /applicants', () => {
  test('should create a new applicant and store in Auth0', async () => {
    const { body } = await request(app).post('/applicants').expect(200);
    expect(body).toEqual({ success: true });
  });
});
