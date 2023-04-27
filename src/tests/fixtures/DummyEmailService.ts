/* eslint-disable class-methods-use-this */
import EmailService from '@App/services/EmailService.js';

class DummyEmailService extends EmailService {
  async sendWelcomeEmail() {
    // noop
  }
}

export default DummyEmailService;
