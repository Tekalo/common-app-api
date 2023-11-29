import { prisma } from '@App/resources/client.js';
import { ReferenceSkillsCreateResponseBody } from '@App/resources/types/skills.js';
import request from 'supertest';
import getDummyApp from '@App/tests/fixtures/appGenerator.js';
import {
  referenceSkillsDummy,
  referenceSkillsDummyDuplicateId,
  skillsAnnotationDummy,
} from '../fixtures/skillGenerator.js';
import { getRandomString } from '../util/helpers.js';
import authHelper, { TokenOptions } from '../util/auth.js';

const dummyApp = getDummyApp();

describe('GET /skills', () => {
  it('should return name field with suggest==true from the Skills View generated from ReferenceSkills table and SkillsAnnotation table', async () => {
    const randomString = getRandomString();
    const partialTokenOptions: TokenOptions = {
      roles: ['admin'],
    };
    const token = await authHelper.getToken(
      `bboberson${randomString}@gmail.com`,
      partialTokenOptions,
    );
    // upsert dummy data to ReferenceSkills table
    const { body: body1 }: { body: ReferenceSkillsCreateResponseBody } =
      await request(dummyApp)
        .post('/skills/referenceSet')
        .send(referenceSkillsDummy)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    expect(body1).toHaveProperty('successCount');
    expect(body1.successCount).toBe(3);

    // upsert dummy data to SkillsAnnotation table
    await prisma.skillsAnnotation.createMany({
      data: skillsAnnotationDummy,
    });

    // execute SQL command to create the view
    await prisma.$executeRaw`
        CREATE VIEW "SkillsView" AS
        SELECT
          sa.name as name,
          COALESCE(sa.canonical, rs.name, sa.name) as canonical,
          CASE
            WHEN sa.suggest IS NOT NULL THEN sa.suggest
            WHEN rs.name IS NOT NULL THEN true
            ELSE false
          END as suggest,
          sa."rejectAs" as "rejectAs"
        FROM "SkillsAnnotation" sa
        LEFT JOIN "ReferenceSkills" rs ON LOWER(sa.name) = LOWER(rs.name)
    `;

    const { body, headers } = await request(dummyApp)
      .get('/skills')
      .expect(200);
    expect(headers).toHaveProperty('cache-control', 'public, max-age=3600');
    expect(body).toEqual({
      data: expect.arrayContaining([
        { canonical: 'Python' },
        { canonical: 'TypeScript' },
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

  it('should successfully insert then update skills with 200 code for request with JWT and admin role', async () => {
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
