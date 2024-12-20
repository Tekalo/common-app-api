/* eslint-disable class-methods-use-this */
import { SendEmailCommandOutput } from '@aws-sdk/client-ses';
import EmailService from '@App/services/EmailService.js';

class DummyEmailService extends EmailService {
  sendEmail(): Promise<SendEmailCommandOutput> {
    return Promise.resolve({ $metadata: {}, MessageId: '' });
  }
}

export default DummyEmailService;
