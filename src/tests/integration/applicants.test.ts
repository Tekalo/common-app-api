import request from 'supertest';
import app from '@App/app.js';

beforeAll(async () => {});

afterAll(async () => {});

describe('POST /applicants', () => {
  test('should create a new applicant and store in Auth0', async () => {
    const response = await request(app).post('/applicants').expect(200);
    expect(response).toEqual({ success: true });
  });
});
