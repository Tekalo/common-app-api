import request from 'supertest';
import getDummyApp from '@App/tests/fixtures/appGenerator.js';
import { getRandomString } from '@App/tests/util/helpers.js';
import authHelper from '../util/auth.js';
import {
  seedSkillsUpload,
  seedSkillsDelete,
} from '../fixtures/skillGenerator.js';
import { seedApplicant } from '../fixtures/applicantSubmissionGenerator.js';

beforeAll(async () => {
  await seedSkillsUpload();
});

afterAll(async () => {
  await seedSkillsDelete();
});

const dummyApp = getDummyApp();

describe('GET /skills', () => {
  it('should return a 401 status code without JWT', async () => {
    await request(dummyApp).get('/skills').expect(401);
  });

  it('should return all skill names in Skills table with JWT', async () => {
    const randomString = getRandomString();
    const token = await authHelper.getToken(
      `bboberson${randomString}@gmail.com`,
    );
    await seedApplicant(randomString);
    const { body } = await request(dummyApp)
      .get('/skills')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(body).toHaveProperty('data');
    const { data } = body;
    expect(data).toBeInstanceOf(Array);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(data[0]).toHaveProperty('name');
  });
});
