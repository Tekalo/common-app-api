import { ReferenceSkillsCreateResponseBody } from '@App/resources/types/skills.js';
import request from 'supertest';
import getDummyApp from '@App/tests/fixtures/appGenerator.js';
import {
  seedSkillsUpload,
  seedSkillsDelete,
} from '../fixtures/skillGenerator.js';
import { getRandomString } from '../util/helpers.js';
import authHelper, { TokenOptions } from '../util/auth.js';

const referenceSkillsDummy = [
  {
    name: 'TypeScript',
    referenceId: 'ET3B93055220D592C8',
  },
  {
    name: 'JavaScript',
    referenceId: 'ET3B93055220D592C9',
  },
  {
    name: 'Python',
    referenceId: 'ET3B93055220D592C10',
  },
  {
    name: 'MongoDB',
    referenceId: 'ET3B93055220D592C8', // duplicate Id
  },
];

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
      .send(referenceSkillsDummy)
      .expect(401);
  });

  it('should return 401 code for request with JWT but without admin role', async () => {
    const randomString = getRandomString();
    const token = await authHelper.getToken(
      `bboberson${randomString}@gmail.com`,
    );
    await request(dummyApp)
      .post('/skills/referenceSet')
      .send(referenceSkillsDummy)
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
    const { body }: { body: ReferenceSkillsCreateResponseBody } = await request(
      dummyApp,
    )
      .post('/skills/referenceSet')
      .send(referenceSkillsDummy)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(body).toHaveProperty('successCounts');
    expect(body.successCounts).toBe(3);
  });
});
