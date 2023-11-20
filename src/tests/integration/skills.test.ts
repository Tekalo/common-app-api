import request from 'supertest';
import getDummyApp from '@App/tests/fixtures/appGenerator.js';
import {
  seedSkillsUpload,
  seedSkillsDelete,
} from '../fixtures/skillGenerator.js';

beforeAll(async () => {
  await seedSkillsUpload();
});

afterAll(async () => {
  await seedSkillsDelete();
});

const dummyApp = getDummyApp();

describe('GET /skills', () => {
  it('should return all skill names in Skills table with no JWT required', async () => {
    const { body, headers } = await request(dummyApp)
      .get('/skills')
      .expect(200);
    expect(headers).toHaveProperty('cache-control', 'public, max-age=3600');
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
