import request from 'supertest';
import getDummyApp from '@App/tests/fixtures/appGenerator.js';
import { getRandomString } from '@App/tests/util/helpers.js';
import configLoader from '@App/services/configLoader.js';
import authHelper, { TokenOptions } from '../util/auth.js';



const dummyApp = getDummyApp();
const appConfig = configLoader.loadConfig();

describe('GET /skills', () => {
    it('should return a 401 status code', async () => {
        await request(dummyApp).get(`/skills`).expect(401);
    });

    it('should return all skill names in Skills table', async () => {
        const randomString = getRandomString();
        const partialTokenOptions: TokenOptions = {
            roles: ['admin'],
        };
        const token = await authHelper.getToken(
            `bboberson${randomString}@gmail.com`,
            partialTokenOptions,
        );
        const { body } = await request(dummyApp)
            .get('/skills')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);
        expect(body).toHaveProperty('name');
    });

});
