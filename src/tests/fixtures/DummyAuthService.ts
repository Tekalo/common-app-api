import AuthService from '@App/services/AuthService.js';
import { User } from 'auth0';
import { getRandomString } from '../util/helpers.js';

class DummyAuthService extends AuthService {
  // eslint-disable-next-line
  async createUser() {
    const mockUser = {
      user_id: `auth0|${getRandomString()}`,
    } as User;
    return mockUser;
  }

  // eslint-disable-next-line
  async generatePasswordReset(auth0Id: string) {
    return { ticket: 'fake-ticket' };
  }

  // eslint-disable-next-line
  async deleteUser(id: string) {
    return { statusCode: 204, message: 'User successfully deleted.' };
  }
}

export default DummyAuthService;
