import request from 'supertest';
import getDummyApp from '@App/tests/fixtures/appGenerator.js';
import { getRandomString } from '@App/tests/util/helpers.js';
import authHelper, { TokenOptions } from '../util/auth.js';
import seedSkillsUpload from '../fixtures/skillGenerator.js';

const dummyApp = getDummyApp();

describe('GET /skills', () => {
  it('should return a 401 status code without admin role', async () => {
    await request(dummyApp).get('/skills').expect(401);
  });

  it('should return all skill names in Skills table with admin role', async () => {
    const randomString = getRandomString();
    const partialTokenOptions: TokenOptions = {
      roles: ['admin'],
    };
    const token = await authHelper.getToken(
      `bboberson${randomString}@gmail.com`,
      partialTokenOptions,
    );
    await seedSkillsUpload();
    const { body } = await request(dummyApp)
      .get('/skills')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(body).toHaveProperty('data');
    const { data } = body;
    if (Array.isArray(data) && data.length !== 0) {
      expect(data[0]).toHaveProperty('name');
    }
  });
});
