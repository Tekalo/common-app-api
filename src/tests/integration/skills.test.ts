import request from 'supertest';
import getDummyApp from '@App/tests/fixtures/appGenerator.js';
import {
  seedSkillsUpload,
  seedSkillsDelete,
} from '../fixtures/skillGenerator.js';
import { getRandomString } from '../util/helpers.js';
import authHelper, { TokenOptions } from '../util/auth.js';

beforeAll(async () => {
  await seedSkillsUpload();
});

afterAll(async () => {
  await seedSkillsDelete();
});

const dummyApp = getDummyApp();

describe('GET /skills', () => {
  it('should return all skill names in Skills table with no JWT required', async () => {
    const { body } = await request(dummyApp).get('/skills').expect(200);
    expect(body).toEqual({
      data: expect.arrayContaining([
        { name: 'Python' },
        { name: 'JS' },
        { name: 'type3script' },
        { name: 'horse training' },
      ]),
    });
  });
});

describe('POST /skills/referenceSet', () => {
  it('should return 401 code for request without JWT', async () => {
    await request(dummyApp)
      .post('/skills/referenceSet')
      .send({
        name: 'TypeScript',
      })
      .expect(401);
  });

  it('should return 401 code for request with JWT but without admin role', async () => {
    const randomString = getRandomString();
    const token = await authHelper.getToken(
      `bboberson${randomString}@gmail.com`,
    );
    await request(dummyApp)
      .post('/skills/referenceSet')
      .send({
        name: 'TypeScript',
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(401);
  });

  it('should return 200 code for request with JWT and admin role', async () => {
    const randomString = getRandomString();
    const partialTokenOptions: TokenOptions = {
      roles: ['admin'],
    };
    const token = await authHelper.getToken(
      `bboberson${randomString}@gmail.com`,
      partialTokenOptions,
    );
    const { body } = await request(dummyApp)
      .post('/skills/referenceSet')
      .send({
        name: 'TypeScript',
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(body).toHaveProperty('referenceId');
    expect(body).toHaveProperty('name');
  });
});
