import AuthService from '@App/services/AuthService.js';
import { User } from 'auth0';

class DummyAuthService extends AuthService {
  // eslint-disable-next-line
  async createUser() {
    const mockUser = {
      user_id: 'auth0|123456789',
    } as User;
    return mockUser;
  }

  // eslint-disable-next-line
  async generatePasswordReset(auth0Id: string) {
    return { ticket: 'fake-ticket' };
  }
}

export default DummyAuthService;
