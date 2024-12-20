import { prisma } from '@App/resources/client.js';
import {
  ReferenceSkillsCreateResponseBody,
  SkillGetResponseBody,
} from '@App/resources/types/skills.js';
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

afterEach(async () => {
  await prisma.skillsAnnotation.deleteMany();
  await prisma.referenceSkills.deleteMany();
});

describe('GET /skills', () => {
  it('Should return suggested skills from the Skills View', async () => {
    // Will specifically return canonical field of all rows where suggest==true and rejectAs==null from the Skills View, which is generated from ReferenceSkills table and SkillsAnnotation table
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { body, headers }: { body: SkillGetResponseBody; headers: any } =
      await request(dummyApp).get('/skills').expect(200);
    expect(headers).toHaveProperty('cache-control', 'public, max-age=3600');
    expect(body.data).toHaveLength(3);
    expect(body).toEqual({
      data: expect.arrayContaining([
        { canonical: 'python', priority: false },
        { canonical: 'TypeScript', priority: false },
        { canonical: 'Node.js', priority: false },
      ]),
    });
    expect(body).toEqual({
      data: expect.not.arrayContaining([
        { canonical: 'JavaScript', priority: false },
      ]),
    });
  });

  it('Should return just one skill if multiple skills share the same canonical value with different casing', async () => {
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
      data: [
        {
          name: 'JS',
          canonical: 'Javascript',
          suggest: true,
          rejectAs: null,
        },
        {
          name: 'JavaScript(JS)',
          canonical: 'JAVASCRIPT',
          suggest: true,
          rejectAs: null,
        },
        {
          name: 'javascript',
          canonical: null,
          suggest: true,
          rejectAs: null,
        },
        {
          name: 'python',
          canonical: null,
          suggest: true,
          rejectAs: null,
        },
        {
          name: 'pithon',
          canonical: 'PYTHON',
          suggest: true,
          rejectAs: null,
        },
      ],
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { body, headers }: { body: SkillGetResponseBody; headers: any } =
      await request(dummyApp).get('/skills').expect(200);
    expect(headers).toHaveProperty('cache-control', 'public, max-age=3600');
    expect(body.data).toHaveLength(3);
    expect(body.data).toEqual([
      { canonical: 'javascript', priority: false },
      { canonical: 'python', priority: false },
      { canonical: 'TypeScript', priority: false },
    ]);
  });

  it('Should return just one skill with higher "priority" if skills share the same canonical value with different "priority"', async () => {
    // Upsert dummy data to SkillsAnnotation table
    await prisma.skillsAnnotation.createMany({
      data: [
        {
          name: 'JS',
          canonical: 'Javascript',
          suggest: true,
          rejectAs: null,
          priority: true,
        },
        {
          name: 'JavaScript(JS)',
          canonical: 'Javascript',
          suggest: true,
          rejectAs: null,
          priority: false,
        },
      ],
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { body, headers }: { body: SkillGetResponseBody; headers: any } =
      await request(dummyApp).get('/skills').expect(200);
    expect(headers).toHaveProperty('cache-control', 'public, max-age=3600');
    expect(body.data).toEqual([{ canonical: 'Javascript', priority: true }]);
  });

  describe('Skills appear in both SkillsAnnotation(SA) and ReferenceSkills(RS) table with the same name value regardless of casing', () => {
    it('Skills where all fields besides name are null should be suggested based on rs.name', async () => {
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
        data: [
          {
            name: 'Typescript',
            canonical: null,
            suggest: null,
            rejectAs: null,
          },
          {
            name: 'JAVAScript',
            canonical: null,
            suggest: null,
            rejectAs: null,
          },
          {
            name: 'python',
            canonical: null,
            suggest: null,
            rejectAs: null,
          },
        ],
      });

      const { body, headers } = await request(dummyApp)
        .get('/skills')
        .expect(200);
      expect(headers).toHaveProperty('cache-control', 'public, max-age=3600');
      expect(body).toEqual({
        data: expect.arrayContaining([
          { canonical: 'Python', priority: false },
          { canonical: 'TypeScript', priority: false },
          { canonical: 'JavaScript', priority: false },
        ]),
      });
    });

    it('Skills which have canonical and suggest is true should be suggested', async () => {
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
        data: [
          {
            name: 'Typescript',
            canonical: 'TypeScript',
            suggest: true,
            rejectAs: null,
          },
          {
            name: 'JAVAScript',
            canonical: 'JavaScript',
            suggest: true,
            rejectAs: null,
          },
          {
            name: 'python',
            canonical: 'Python',
            suggest: true,
            rejectAs: null,
          },
        ],
      });

      const { body, headers } = await request(dummyApp)
        .get('/skills')
        .expect(200);
      expect(headers).toHaveProperty('cache-control', 'public, max-age=3600');
      expect(body).toEqual({
        data: expect.arrayContaining([
          { canonical: 'Python', priority: false },
          { canonical: 'TypeScript', priority: false },
          { canonical: 'JavaScript', priority: false },
        ]),
      });
    });

    it('Skills which have no canonical and suggest is true should still be suggested based on sa.name', async () => {
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
        data: [
          {
            name: 'Typescript',
            canonical: null,
            suggest: true,
            rejectAs: null,
          },
          {
            name: 'JAVAScript',
            canonical: null,
            suggest: true,
            rejectAs: null,
          },
          {
            name: 'python',
            canonical: null,
            suggest: true,
            rejectAs: null,
          },
        ],
      });

      const { body, headers } = await request(dummyApp)
        .get('/skills')
        .expect(200);
      expect(headers).toHaveProperty('cache-control', 'public, max-age=3600');
      expect(body).toEqual({
        data: expect.arrayContaining([
          { canonical: 'python', priority: false },
          { canonical: 'Typescript', priority: false },
          { canonical: 'JAVAScript', priority: false },
        ]),
      });
      // should not use rs.name when sa.name is available
      expect(body).toEqual({
        data: expect.not.arrayContaining([
          { canonical: 'Python', priority: false },
          { canonical: 'TypeScript', priority: false },
          { canonical: 'JavaScript', priority: false },
        ]),
      });
    });

    it('Skills which have canonical but suggest is false should not be suggested', async () => {
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
        data: [
          {
            name: 'Typescript',
            canonical: 'TypeScript',
            suggest: false,
            rejectAs: null,
          },
          {
            name: 'JAVAScript',
            canonical: 'JavaScript',
            suggest: false,
            rejectAs: null,
          },
          {
            name: 'python',
            canonical: 'Python',
            suggest: false,
            rejectAs: null,
          },
        ],
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { body, headers }: { body: SkillGetResponseBody; headers: any } =
        await request(dummyApp).get('/skills').expect(200);
      expect(headers).toHaveProperty('cache-control', 'public, max-age=3600');
      expect(body.data).toEqual([]);
    });

    it('Skills where suggest is true but rejectAs is not null should not be suggested', async () => {
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
        data: [
          {
            name: 'Typescript',
            canonical: 'TypeScript',
            suggest: true,
            rejectAs: 'spam',
          },
          {
            name: 'JAVAScript',
            canonical: 'JavaScript',
            suggest: true,
            rejectAs: 'spam',
          },
          {
            name: 'python',
            canonical: 'Python',
            suggest: true,
            rejectAs: 'spam',
          },
        ],
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { body, headers }: { body: SkillGetResponseBody; headers: any } =
        await request(dummyApp).get('/skills').expect(200);
      expect(headers).toHaveProperty('cache-control', 'public, max-age=3600');
      expect(body.data).toEqual([]);
    });
  });

  describe('Skills appear in SkillsAnnotation(SA) table but not in ReferenceSkills(RS) table', () => {
    it('Skills where all fields besides name are null should not be suggested', async () => {
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
        data: [
          {
            name: 'Database',
            canonical: null,
            suggest: null,
            rejectAs: null,
          },
          {
            name: 'nodejs',
            canonical: null,
            suggest: null,
            rejectAs: null,
          },
        ],
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { body, headers }: { body: SkillGetResponseBody; headers: any } =
        await request(dummyApp).get('/skills').expect(200);
      expect(headers).toHaveProperty('cache-control', 'public, max-age=3600');
      expect(body.data).toHaveLength(3);
      expect(body).toEqual({
        data: expect.arrayContaining([
          { canonical: 'Python', priority: false },
          { canonical: 'TypeScript', priority: false },
          { canonical: 'JavaScript', priority: false },
        ]),
      });
      expect(body).toEqual({
        data: expect.not.arrayContaining([
          { canonical: 'Database', priority: false },
          { canonical: 'nodejs', priority: false },
        ]),
      });
    });

    it('Skills which have canonical and suggest is true should be suggested', async () => {
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
        data: [
          {
            name: 'Database',
            canonical: 'Database',
            suggest: true,
            rejectAs: null,
          },
          {
            name: 'nodejs',
            canonical: 'Node.js',
            suggest: true,
            rejectAs: null,
          },
        ],
      });

      const { body, headers } = await request(dummyApp)
        .get('/skills')
        .expect(200);
      expect(headers).toHaveProperty('cache-control', 'public, max-age=3600');
      expect(body).toEqual({
        data: expect.arrayContaining([
          { canonical: 'Python', priority: false },
          { canonical: 'TypeScript', priority: false },
          { canonical: 'JavaScript', priority: false },
          { canonical: 'Node.js', priority: false },
          { canonical: 'Database', priority: false },
        ]),
      });
    });

    it('Skills which have no canonical but suggest is true should still be suggested based on sa.name', async () => {
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
        data: [
          {
            name: 'Database',
            canonical: null,
            suggest: true,
            rejectAs: null,
          },
          {
            name: 'nodejs',
            canonical: null,
            suggest: true,
            rejectAs: null,
          },
        ],
      });

      const { body, headers } = await request(dummyApp)
        .get('/skills')
        .expect(200);
      expect(headers).toHaveProperty('cache-control', 'public, max-age=3600');
      expect(body).toEqual({
        data: expect.arrayContaining([
          { canonical: 'Python', priority: false },
          { canonical: 'TypeScript', priority: false },
          { canonical: 'JavaScript', priority: false },
          { canonical: 'nodejs', priority: false },
          { canonical: 'Database', priority: false },
        ]),
      });
    });

    it('Skills which have canonical but suggest is false should not be suggested', async () => {
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
        data: [
          {
            name: 'Database',
            canonical: 'Database',
            suggest: false,
            rejectAs: null,
          },
          {
            name: 'nodejs',
            canonical: 'Node.js',
            suggest: false,
            rejectAs: null,
          },
        ],
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { body, headers }: { body: SkillGetResponseBody; headers: any } =
        await request(dummyApp).get('/skills').expect(200);
      expect(headers).toHaveProperty('cache-control', 'public, max-age=3600');
      expect(body.data).toHaveLength(3);
      expect(body).toEqual({
        data: expect.arrayContaining([
          { canonical: 'Python', priority: false },
          { canonical: 'TypeScript', priority: false },
          { canonical: 'JavaScript', priority: false },
        ]),
      });
      expect(body).toEqual({
        data: expect.not.arrayContaining([
          { canonical: 'Database' },
          { canonical: 'Node.js' },
        ]),
      });
    });

    it('Skills where suggest is true but rejectAs is not null should not be suggested', async () => {
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
        data: [
          {
            name: 'Database',
            canonical: 'Database',
            suggest: true,
            rejectAs: 'spam',
          },
          {
            name: 'nodejs',
            canonical: 'Node.js',
            suggest: true,
            rejectAs: 'spam',
          },
        ],
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { body, headers }: { body: SkillGetResponseBody; headers: any } =
        await request(dummyApp).get('/skills').expect(200);
      expect(headers).toHaveProperty('cache-control', 'public, max-age=3600');
      expect(body.data).toHaveLength(3);
      expect(body).toEqual({
        data: expect.arrayContaining([
          { canonical: 'Python', priority: false },
          { canonical: 'TypeScript', priority: false },
          { canonical: 'JavaScript', priority: false },
        ]),
      });
      expect(body).toEqual({
        data: expect.not.arrayContaining([
          { canonical: 'Database', priority: false },
          { canonical: 'Node.js', priority: false },
        ]),
      });
    });
  });

  describe('Skills appear in ReferenceSkills(RS) table but not in SkillsAnnotation(SA) table', () => {
    it('Should always be suggested, even though no data in SA will be suggested', async () => {
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
        data: [
          {
            name: 'Database',
            canonical: 'Database',
            suggest: false,
            rejectAs: null,
          },
          {
            name: 'nodejs',
            canonical: 'Node.js',
            suggest: true,
            rejectAs: 'spam',
          },
        ],
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { body, headers }: { body: SkillGetResponseBody; headers: any } =
        await request(dummyApp).get('/skills').expect(200);
      expect(headers).toHaveProperty('cache-control', 'public, max-age=3600');
      expect(body.data).toHaveLength(3);
      expect(body).toEqual({
        data: expect.arrayContaining([
          { canonical: 'Python', priority: false },
          { canonical: 'TypeScript', priority: false },
          { canonical: 'JavaScript', priority: false },
        ]),
      });
      expect(body).toEqual({
        data: expect.not.arrayContaining([
          { canonical: 'Database', priority: false },
          { canonical: 'nodejs', priority: false },
        ]),
      });
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
