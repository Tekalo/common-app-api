import { jest } from '@jest/globals';
import { AppMetadata, User, UserMetadata } from 'auth0';
import AuthService from '@App/services/AuthService.js';
import DummyAuth0ManagementClient from '../fixtures/DummyAuth0ManagementClient.js';
import { getRandomString } from '../util/helpers.js';

describe('Auth Service', () => {
  test('should return existing auth0 user', async () => {
    const authService = new AuthService();
    const email = `bboberson${getRandomString()}@gmail.com`;
    const mockAuth0User = {
      created_at: '2023-05-22T23:48:32.212Z',
      email,
      email_verified: false,
      identities: [
        {
          connection: 'Username-Password-Authentication',
          user_id: '123456',
          provider: 'auth0',
          isSocial: false,
        },
      ],
      updated_at: '2023-05-22T23:48:32.212Z',
      user_id: 'auth0|123456',
    };
    const dummyAuth0ManagementClient = new DummyAuth0ManagementClient({
      domain: 'xxx',
      clientId: 'xxx',
      clientSecret: 'xxx',
    });
    jest.spyOn(authService, 'getClient').mockImplementation(() => {
      dummyAuth0ManagementClient.getUsersByEmail = (): Promise<
        Array<User<AppMetadata, UserMetadata>>
      > => Promise.resolve([mockAuth0User]);
      return dummyAuth0ManagementClient;
    });
    const userExists = await authService.userExists(email);
    expect(userExists).toEqual(true);
  });
});
