import EmailService from '@App/services/EmailService.js';
import { jest } from '@jest/globals';
import DummySESService from '../fixtures/DummySesService.js';
import { getMockConfig } from '../util/helpers.js';

describe('Email Service', () => {
  test('should successfully generate welcome email', () => {
    const dummySesService = new DummySESService();
    const emailService = new EmailService(
      dummySesService,
      getMockConfig({
        aws: { sesFromAddress: 'baz@futurestech.com', region: 'us-east-1' },
      }),
    );
    const resp = emailService.generateWelcomeEmail(
      'foo@bar.com',
      'fake-ticket',
    );
    expect(resp).toEqual({
      Destination: {
        ToAddresses: ['foo@bar.com'],
      },
      Message: {
        Body: {
          Text: {
            Charset: 'UTF-8',
            Data: 'TOOD: Style me!!!!',
          },
          Html: {
            Charset: 'UTF-8',
            Data: `Thanks for applying to Tekalo! Your assigned Tekalo Talent Connector will 
                review your application and contact you via your preferred contact method once matches are available.
                In the meantime, you can sign in to your Tekalo account (<link to sign in page>) by using your Google 
                or LinkedIn account associated with this email address, or by setting up a <a class="ulink" href="fake-ticket" 
                target="_blank">new password</a> for your account.
    
                Thanks,
                The Tekalo team`,
          },
        },
        Subject: {
          Charset: 'UTF-8',
          Data: 'Hallo from Tekalo!',
        },
      },
      Source: 'baz@futurestech.com',
    });
  });

  test('should successfully send welcome email', async () => {
    const dummySesService = new DummySESService();
    const mockSesSendEmailFunc = jest.spyOn(dummySesService, 'sendEmail');
    const emailService = new EmailService(
      dummySesService,
      getMockConfig({
        aws: { sesFromAddress: 'baz@futurestech.com', region: 'us-east-1' },
      }),
    );
    const welcomeEmailBody = emailService.generateWelcomeEmail(
      'foo@bar.com',
      'fake-ticket',
    );
    await emailService.sendEmail(welcomeEmailBody);
    expect(mockSesSendEmailFunc).toBeCalledWith(welcomeEmailBody);
  });
});
