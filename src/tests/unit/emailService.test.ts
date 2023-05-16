import getApplicantDeletionEmail from '@App/resources/emails/applicantDeletion.js';
import getWelcomeEmail from '@App/resources/emails/welcomeEmail.js';
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
    const expectedEmail = getWelcomeEmail('fake-ticket');
    expect(resp).toHaveProperty('Destination', {
      ToAddresses: ['foo@bar.com'],
    });
    expect(resp).toHaveProperty('Source', 'baz@futurestech.com');
    expect(resp).toHaveProperty('Message', {
      Subject: {
        Charset: 'UTF-8',
        Data: expect.stringMatching(expectedEmail.subject),
      },
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: expect.stringMatching(expectedEmail.htmlBody),
        },
      },
    });
  });

  test('should successfully generate applicant deletion email', () => {
    const dummySesService = new DummySESService();
    const emailService = new EmailService(
      dummySesService,
      getMockConfig({
        aws: { sesFromAddress: 'baz@futurestech.com', region: 'us-east-1' },
      }),
    );
    const result = emailService.generateApplicantDeletionEmail(
      'foo@bar.com',
      'Robin Williams',
    );
    const expectedEmail = getApplicantDeletionEmail(
      'fake-ticket',
      'Robin Williams',
    );
    expect(result).toHaveProperty('Destination', {
      ToAddresses: ['foo@bar.com'],
    });
    expect(result).toHaveProperty('Source', 'baz@futurestech.com');
    expect(result).toHaveProperty('Message', {
      Subject: {
        Charset: 'UTF-8',
        Data: expect.stringMatching(expectedEmail.subject),
      },
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: expect.stringMatching(expectedEmail.htmlBody),
        },
      },
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
