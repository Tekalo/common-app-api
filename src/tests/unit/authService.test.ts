import { jest } from '@jest/globals';
import AuthService from '@App/services/AuthService.js';
// import configLoader from '@App/services/configLoader.js';
// import { ManagementClient, UsersByEmailManager } from 'auth0';
import DummyAuth0ManagementClient from '../fixtures/DummyAuth0ManagementClient.js';
import { getRandomString } from '../util/helpers.js';
// import DummyAuth0UsersByEmail from '../fixtures/DummyAuth0UsersByEmail.js';
import auth0ResponseGenerator from '../fixtures/auth0ResponseGenerator.js';
import DummyAuth0EmailManager from '../fixtures/DummyAuth0UsersByEmailManager.js';

describe('Auth Service', () => {
  test('should return existing auth0 user', async () => {
    const authService = new AuthService();
    const email = `bboberson${getRandomString()}@gmail.com`;
    const dummyAuth0ManagementClient = new DummyAuth0ManagementClient({
      domain: 'xxx',
      clientId: 'xxx',
      clientSecret: 'xxx',
    });
    jest.spyOn(authService, 'getClient').mockImplementation(() => {
      const dummyEmailManager = new DummyAuth0EmailManager({
        baseUrl: 'https://auth0-test.com',
        parseError: () => Promise.resolve(new Error()),
      });
      dummyEmailManager.getByEmail = async () =>
        Promise.resolve({
          data: [
            auth0ResponseGenerator.getMockUserCreateResponse('auth0|1234'),
          ],
          status: 200,
          statusText: '',
          headers: '',
        });
      return dummyAuth0ManagementClient;
    });
    const userExists = await authService.userExists(email);
    expect(userExists).toEqual(true);
  });
});
