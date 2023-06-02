import AuthService from '@App/services/AuthService.js';
import { User } from 'auth0';
import { getRandomString } from '../util/helpers.js';

class DummyAuthService extends AuthService {
  // eslint-disable-next-line
  async generatePasswordReset(auth0Id: string) {
    return { ticket: 'fake-ticket' };
  }

  // eslint-disable-next-line
  async deleteUser(id: string) {}

  // eslint-disable-next-line
  async createUser() {
    const mockUser = {
      user_id: `auth0|${getRandomString()}`,
    } as User;
    return mockUser;
  }

  // eslint-disable-next-line
  async userExists() {
    return false;
  }

  // eslint-disable-next-line
  async getUser(auth0Id: string) {
    const mockUser = {
      id: auth0Id,
      email: 'mockemail@schmidtfutures.com',
      name: 'Mock TestUser',
    } as User;
    return mockUser;
  }
}

export default DummyAuthService;
