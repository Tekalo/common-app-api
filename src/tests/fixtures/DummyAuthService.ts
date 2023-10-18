import AuthService from '@App/services/AuthService.js';
import { getRandomString } from '../util/helpers.js';
import auth0Generator from './auth0ResponseGenerator.js';

class DummyAuthService extends AuthService {
  // eslint-disable-next-line
  async generatePasswordReset(auth0Id: string) {
    return {
      data: { ticket: 'fake-ticket' },
      headers: '',
      status: 200,
      statusText: '',
    };
  }

  // eslint-disable-next-line
  async deleteUsers(email: string, auth0Id: string) {
    return [{ data: undefined, headers: '', status: 200, statusText: '' }];
  }

  // eslint-disable-next-line
  async createUser(data: { name: string; email: string }) {
    const auth0Id = getRandomString();
    const mockUser = {
      data: auth0Generator.getMockUserCreateResponse(`auth0|${auth0Id}`),
      headers: '',
      status: 200,
      statusText: '',
    };
    return mockUser;
  }

  // eslint-disable-next-line
  async userExists(email: string): Promise<boolean> {
    return false;
  }

  // eslint-disable-next-line
  async getUser(auth0Id: string) {
    const mockUser = auth0Generator.getMockUserCreateResponse(auth0Id);
    return { data: mockUser, headers: '', status: 200, statusText: '' };
  }
}

export default DummyAuthService;
