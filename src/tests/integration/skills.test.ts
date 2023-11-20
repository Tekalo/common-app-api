import { prisma } from '@App/resources/client.js';
import { ReferenceSkillsCreateResponseBody } from '@App/resources/types/skills.js';
import request from 'supertest';
import getDummyApp from '@App/tests/fixtures/appGenerator.js';
import {
  seedSkillsUpload,
  seedSkillsDelete,
  referenceSkillsDummy,
  referenceSkillsDummyDuplicateId,
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
    // upsert tuples to db
    const { body: body1 }: { body: ReferenceSkillsCreateResponseBody } =
      await request(dummyApp)
        .post('/skills/referenceSet')
        .send(referenceSkillsDummy)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    expect(body1).toHaveProperty('successCount');
    expect(body1.successCount).toBe(3);

    // upsert tuple with duplicate id
    const { body: body2 }: { body: ReferenceSkillsCreateResponseBody } =
      await request(dummyApp)
        .post('/skills/referenceSet')
        .send(referenceSkillsDummyDuplicateId)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    expect(body2).toHaveProperty('successCount');
    expect(body2.successCount).toBe(1);
    const foundElement = await prisma.referenceSkills.findUnique({
      where: {
        referenceId: referenceSkillsDummyDuplicateId[0].referenceId,
      },
    });
    expect(foundElement?.name).toBe(referenceSkillsDummyDuplicateId[0].name);
  });
});
