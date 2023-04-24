import EmailService from '@App/services/EmailService.js';

class DummyEmailService extends EmailService {
  // eslint-disable-next-line
  async sendEmail(email: string, ticket: string) {
    return {
      MessageId: 'abc-123',
      $metadata: {},
    };
  }
}

export default DummyEmailService;
