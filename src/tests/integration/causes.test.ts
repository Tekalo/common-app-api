import { prisma } from '@App/resources/client.js';
import { CauseGetResponseBody } from '@App/resources/types/causes.js';
import request from 'supertest';
import getDummyApp from '@App/tests/fixtures/appGenerator.js';
import { causesAnnotationDummy } from '../fixtures/causeGenerator.js';

const dummyApp = getDummyApp();

afterEach(async () => {
  await prisma.causesAnnotation.deleteMany();
});

describe('GET /causes', () => {
  it('Should return suggested causes from the Causes View', async () => {
    // Will specifically return canonical field of all rows where suggest==true and rejectAs==null from the Causes View,
    // which is generated from the CausesAnnotation table

    // upsert dummy data to CausesAnnotation table
    await prisma.causesAnnotation.createMany({
      data: causesAnnotationDummy,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { body, headers }: { body: CauseGetResponseBody; headers: any } =
      await request(dummyApp).get('/causes').expect(200);
    expect(headers).toHaveProperty('cache-control', 'public, max-age=3600');
    expect(body.data).toHaveLength(3);
    expect(body).toEqual({
      data: expect.arrayContaining([
        { canonical: 'Climate change', priority: false },
        { canonical: 'Government & civic tech', priority: false },
        { canonical: 'Education', priority: false },
      ]),
    });
    expect(body).toEqual({
      data: expect.not.arrayContaining([
        { canonical: 'h3alth', priority: false },
      ]),
    });
  });

  it('Should return just one cause if multiple causes share the same canonical value with different casing', async () => {
    // upsert dummy data to CausesAnnotation table
    await prisma.causesAnnotation.createMany({
      data: [
        {
          name: 'CLIMATE',
          canonical: 'Climate change',
          suggest: true,
          rejectAs: null,
        },
        {
          name: 'Climate change',
          canonical: null,
          suggest: true,
          rejectAs: null,
        },
        {
          name: 'CLIMATE change!!',
          canonical: 'CLIMATE CHANGE',
          suggest: true,
          rejectAs: null,
        },
        {
          name: 'Education',
          canonical: null,
          suggest: true,
          rejectAs: null,
        },
        {
          name: 'edumactaion',
          canonical: 'EDUCATION',
          suggest: true,
          rejectAs: null,
        },
      ],
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { body, headers }: { body: CauseGetResponseBody; headers: any } =
      await request(dummyApp).get('/causes').expect(200);
    expect(headers).toHaveProperty('cache-control', 'public, max-age=3600');
    expect(body.data).toHaveLength(2);
    expect(body.data).toEqual([
      { canonical: 'Climate change', priority: false },
      { canonical: 'Education', priority: false },
    ]);
  });

  it('Should return just one cause with higher "priority" if causes share the same canonical value with different "priority"', async () => {
    // Upsert dummy data to CausesAnnotation table
    await prisma.causesAnnotation.createMany({
      data: [
        {
          name: 'CLIMATE',
          canonical: 'Climate change',
          suggest: true,
          rejectAs: null,
          priority: true,
        },
        {
          name: 'Climate!!',
          canonical: 'Climate change',
          suggest: true,
          rejectAs: null,
          priority: false,
        },
      ],
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { body, headers }: { body: CauseGetResponseBody; headers: any } =
      await request(dummyApp).get('/causes').expect(200);
    expect(headers).toHaveProperty('cache-control', 'public, max-age=3600');
    expect(body.data).toEqual([
      { canonical: 'Climate change', priority: true },
    ]);
  });

  it('Causes should be suggested when all fields aside from name are null and suggest is true', async () => {
    // upsert dummy data to CausesAnnotation table
    await prisma.causesAnnotation.createMany({
      data: [
        {
          name: 'Health & well-being',
          canonical: null,
          suggest: true,
          rejectAs: null,
        },
        {
          name: 'CLIMATE change',
          canonical: null,
          suggest: true,
          rejectAs: null,
        },
        {
          name: 'education',
          canonical: null,
          suggest: true,
          rejectAs: null,
        },
      ],
    });

    const { body, headers } = await request(dummyApp)
      .get('/causes')
      .expect(200);
    expect(headers).toHaveProperty('cache-control', 'public, max-age=3600');
    expect(body).toEqual({
      data: expect.arrayContaining([
        { canonical: 'Health & well-being', priority: false },
        { canonical: 'CLIMATE change', priority: false },
        { canonical: 'education', priority: false },
      ]),
    });
  });

  it('Causes which have canonical and suggest is true should be suggested', async () => {
    // upsert dummy data to CausesAnnotation table
    await prisma.causesAnnotation.createMany({
      data: [
        {
          name: 'Health & well-being',
          canonical: 'Health & well-being',
          suggest: true,
          rejectAs: null,
        },
        {
          name: 'CLIMATE change',
          canonical: 'Climate change',
          suggest: true,
          rejectAs: null,
        },
        {
          name: 'education',
          canonical: 'Education',
          suggest: true,
          rejectAs: null,
        },
      ],
    });

    const { body, headers } = await request(dummyApp)
      .get('/causes')
      .expect(200);
    expect(headers).toHaveProperty('cache-control', 'public, max-age=3600');
    expect(body).toEqual({
      data: expect.arrayContaining([
        { canonical: 'Health & well-being', priority: false },
        { canonical: 'Climate change', priority: false },
        { canonical: 'Education', priority: false },
      ]),
    });
  });

  it('Causes which have no canonical and suggest is true should still be suggested based on name', async () => {
    // upsert dummy data to CausesAnnotation table
    await prisma.causesAnnotation.createMany({
      data: [
        {
          name: 'Health & well-being',
          canonical: null,
          suggest: true,
          rejectAs: null,
        },
        {
          name: 'CLIMATE change',
          canonical: null,
          suggest: true,
          rejectAs: null,
        },
        {
          name: 'education',
          canonical: null,
          suggest: true,
          rejectAs: null,
        },
      ],
    });

    const { body, headers } = await request(dummyApp)
      .get('/causes')
      .expect(200);
    expect(headers).toHaveProperty('cache-control', 'public, max-age=3600');
    expect(body).toEqual({
      data: expect.arrayContaining([
        { canonical: 'Health & well-being', priority: false },
        { canonical: 'CLIMATE change', priority: false },
        { canonical: 'education', priority: false },
      ]),
    });
  });

  it('Causes which have canonical but suggest is false should not be suggested', async () => {
    // upsert dummy data to CausesAnnotation table
    await prisma.causesAnnotation.createMany({
      data: [
        {
          name: 'Health & well-being',
          canonical: 'Health & well-being',
          suggest: false,
          rejectAs: null,
        },
        {
          name: 'CLIMATE change',
          canonical: 'Climate change',
          suggest: false,
          rejectAs: null,
        },
        {
          name: 'education',
          canonical: 'Education',
          suggest: false,
          rejectAs: null,
        },
      ],
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { body, headers }: { body: CauseGetResponseBody; headers: any } =
      await request(dummyApp).get('/causes').expect(200);
    expect(headers).toHaveProperty('cache-control', 'public, max-age=3600');
    expect(body.data).toEqual([]);
  });

  it('Causes where suggest is true but rejectAs is not null should not be suggested', async () => {
    // upsert dummy data to CausesAnnotation table
    await prisma.causesAnnotation.createMany({
      data: [
        {
          name: 'Health & well-being',
          canonical: 'Health & well-being',
          suggest: true,
          rejectAs: 'spam',
        },
        {
          name: 'CLIMATE change',
          canonical: 'Climate change',
          suggest: true,
          rejectAs: 'spam',
        },
        {
          name: 'education',
          canonical: 'Education',
          suggest: true,
          rejectAs: 'spam',
        },
      ],
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { body, headers }: { body: CauseGetResponseBody; headers: any } =
      await request(dummyApp).get('/causes').expect(200);
    expect(headers).toHaveProperty('cache-control', 'public, max-age=3600');
    expect(body.data).toEqual([]);
  });

  it('Causes where all fields besides name are null should not be suggested', async () => {
    // upsert dummy data to CausesAnnotation table
    await prisma.causesAnnotation.createMany({
      data: [
        {
          name: 'Health & well-being',
          canonical: null,
          suggest: null,
          rejectAs: null,
        },
        {
          name: 'Education',
          canonical: null,
          suggest: null,
          rejectAs: null,
        },
      ],
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { body, headers }: { body: CauseGetResponseBody; headers: any } =
      await request(dummyApp).get('/causes').expect(200);
    expect(headers).toHaveProperty('cache-control', 'public, max-age=3600');
    expect(body.data).toHaveLength(0);
    expect(body.data).toEqual([]);
  });

  it('Causes which have canonical and suggest is true should be suggested', async () => {
    // upsert dummy data to CausesAnnotation table
    await prisma.causesAnnotation.createMany({
      data: [
        {
          name: 'Health & well-being',
          canonical: 'Health & well-being',
          suggest: true,
          rejectAs: null,
        },
        {
          name: 'education',
          canonical: 'Education',
          suggest: true,
          rejectAs: null,
        },
      ],
    });

    const { body, headers } = await request(dummyApp)
      .get('/causes')
      .expect(200);
    expect(headers).toHaveProperty('cache-control', 'public, max-age=3600');
    expect(body).toEqual({
      data: expect.arrayContaining([
        { canonical: 'Health & well-being', priority: false },
        { canonical: 'Education', priority: false },
      ]),
    });
  });
});
