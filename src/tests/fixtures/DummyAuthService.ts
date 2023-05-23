import AuthService from '@App/services/AuthService.js';

class DummyAuthService extends AuthService {
  // eslint-disable-next-line
  async generatePasswordReset(auth0Id: string) {
    return { ticket: 'fake-ticket' };
  }

  // eslint-disable-next-line
  async deleteUser(id: string) {}
}

export default DummyAuthService;
