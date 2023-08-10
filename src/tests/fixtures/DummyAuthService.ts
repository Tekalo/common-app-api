import { AppMetadata, User, UserMetadata } from 'auth0';
import AuthService from '@App/services/AuthService.js';
import { getRandomString } from '../util/helpers.js';

class DummyAuthService extends AuthService {
  // eslint-disable-next-line
  async generatePasswordReset(auth0Id: string) {
    return { ticket: 'fake-ticket' };
  }

  // eslint-disable-next-line
  async deleteUsers(email: string, auth0Id: string): Promise<void[]> {
    return [];
  }

  // eslint-disable-next-line
  async createUser(data: {
    name: string;
    email: string;
  }): Promise<User<AppMetadata, UserMetadata>> {
    const mockUser = {
      user_id: `auth0|${getRandomString()}`,
    } as User;
    return mockUser;
  }

  // eslint-disable-next-line
  async userExists(email: string): Promise<boolean> {
    return false;
  }

  // eslint-disable-next-line
  async getUser(auth0Id: string): Promise<User<AppMetadata, UserMetadata>> {
    const mockUser = {
      id: auth0Id,
      email: 'mockemail@schmidtfutures.com',
      name: 'Mock TestUser',
    } as User;
    return mockUser;
  }
}

export default DummyAuthService;
