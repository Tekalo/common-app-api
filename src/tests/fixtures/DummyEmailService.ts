/* eslint-disable class-methods-use-this */
import EmailService from '@App/services/EmailService.js';
import { SendEmailCommandOutput } from '@aws-sdk/client-ses';

class DummyEmailService extends EmailService {
  sendEmail(): Promise<SendEmailCommandOutput> {
    return Promise.resolve({ $metadata: {}, MessageId: '' });
  }
}

export default DummyEmailService;
