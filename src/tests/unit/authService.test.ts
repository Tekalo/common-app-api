import AuthService from '@App/services/AuthService.js';
import { jest } from '@jest/globals';
import { AppMetadata, User, UserMetadata } from 'auth0';
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
    expect(await authService.getExistingUser(email)).toEqual(mockAuth0User);
  });
  test('should return auth0 user with most recent login if more than one exists for a given email', async () => {
    const authService = new AuthService();
    const email = `bboberson${getRandomString()}@gmail.com`;
    const mockAuth0Users = [
      {
        created_at: '2023-05-01T01:23:45.666Z',
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
      },
      {
        created_at: '2023-04-01T01:23:45.666Z',
        email,
        identities: [
          {
            provider: 'google-oauth2',
            access_token: 'xyz12345',
            expires_in: 3599,
            user_id: 'zzz7890',
            connection: 'google-oauth2',
            isSocial: true,
          },
        ],
        name: 'Bob Boberson',
        user_id: 'google-oauth2|zzz7890',
        last_login: '2023-05-22T16:16:35.239Z',
        logins_count: 1,
      },
    ];
    const dummyAuth0ManagementClient = new DummyAuth0ManagementClient({
      domain: 'xxx',
      clientId: 'xxx',
      clientSecret: 'xxx',
    });
    jest.spyOn(authService, 'getClient').mockImplementation(() => {
      dummyAuth0ManagementClient.getUsersByEmail = (): Promise<
        Array<User<AppMetadata, UserMetadata>>
      > => Promise.resolve(mockAuth0Users);
      return dummyAuth0ManagementClient;
    });
    expect(await authService.getExistingUser(email)).toEqual(mockAuth0Users[1]);
  });
  test('should return auth0 user none have last login set', async () => {
    const authService = new AuthService();
    const email = `bboberson${getRandomString()}@gmail.com`;
    const mockAuth0Users = [
      {
        created_at: '2023-05-01T01:23:45.666Z',
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
      },
      {
        created_at: '2023-04-01T01:23:45.666Z',
        email,
        identities: [
          {
            provider: 'google-oauth2',
            access_token: 'xyz12345',
            expires_in: 3599,
            user_id: 'zzz7890',
            connection: 'google-oauth2',
            isSocial: true,
          },
        ],
        name: 'Bob Boberson',
        user_id: 'google-oauth2|zzz7890',
        last_login: '2023-05-22T16:16:35.239Z',
        logins_count: 1,
      },
    ];
    const dummyAuth0ManagementClient = new DummyAuth0ManagementClient({
      domain: 'xxx',
      clientId: 'xxx',
      clientSecret: 'xxx',
    });
    jest.spyOn(authService, 'getClient').mockImplementation(() => {
      dummyAuth0ManagementClient.getUsersByEmail = (): Promise<
        Array<User<AppMetadata, UserMetadata>>
      > => Promise.resolve(mockAuth0Users);
      return dummyAuth0ManagementClient;
    });
    expect(await authService.getExistingUser(email)).toEqual(mockAuth0Users[1]);
  });
});
