import getApplicantDeletionEmail from '@App/resources/emails/applicantDeletion.js';
import getOrgWelcomeEmail from '@App/resources/emails/orgWelcomeEmail.js';
import getApplicantWelcomeEmail from '@App/resources/emails/applicantWelcomeEmail.js';
import EmailService from '@App/services/EmailService.js';
import { jest } from '@jest/globals';
import DummySESService from '../../fixtures/DummySesService.js';
import { getMockConfig } from '../../util/helpers.js';

describe('Email Service', () => {
  test('should successfully generate applicant welcome email', () => {
    const dummySesService = new DummySESService();
    const emailService = new EmailService(
      dummySesService,
      getMockConfig({
        aws: {
          sesFromAddress: 'baz@futurestech.com',
          sesReplyToAddress: 'replies@futurestech.com',
          region: 'us-east-1',
        },
      }),
    );
    const email = 'foo@bar.com';
    const passwordTicket = 'fake-ticket';
    const signInLink = 'https://login_link';
    const resp = emailService.generateApplicantWelcomeEmail(
      email,
      passwordTicket,
      signInLink,
    );
    const expectedEmail = getApplicantWelcomeEmail(passwordTicket, signInLink);
    expect(resp).toHaveProperty('Destination', {
      ToAddresses: ['foo@bar.com'],
    });
    expect(resp).toHaveProperty('Source', 'baz@futurestech.com');
    expect(resp).toHaveProperty('ReplyToAddresses', [
      'replies@futurestech.com',
    ]);
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
        aws: {
          sesFromAddress: 'baz@futurestech.com',
          sesReplyToAddress: 'replies@futurestech.com',
          region: 'us-east-1',
        },
      }),
    );
    const result = emailService.generateApplicantDeletionEmail(
      'foo@bar.com',
      'Robin Williams',
    );
    const expectedEmail = getApplicantDeletionEmail('Robin Williams');
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

  test('should successfully generate application submit email', async () => {
    const dummySesService = new DummySESService();
    const mockSesSendEmailFunc = jest.spyOn(dummySesService, 'sendEmail');
    const emailService = new EmailService(
      dummySesService,
      getMockConfig({
        aws: {
          sesFromAddress: 'baz@futurestech.com',
          sesReplyToAddress: 'replies@futurestech.com',
          region: 'us-east-1',
        },
      }),
    );
    const postSubmitEmailBody =
      emailService.generateApplicantPostSubmitEmail('foo@bar.com');
    await emailService.sendEmail(postSubmitEmailBody);
    expect(mockSesSendEmailFunc).toBeCalledWith(postSubmitEmailBody);
  });

  test('should successfully generate org welcome email', () => {
    const dummySesService = new DummySESService();
    const emailService = new EmailService(
      dummySesService,
      getMockConfig({
        aws: {
          sesFromAddress: 'baz@futurestech.com',
          sesReplyToAddress: 'replies@futurestech.com',
          region: 'us-east-1',
        },
      }),
    );
    const resp = emailService.generateOrgWelcomeEmail('foo@bar.com');
    const expectedEmail = getOrgWelcomeEmail();
    expect(resp).toHaveProperty('Destination', {
      ToAddresses: ['foo@bar.com'],
    });
    expect(resp).toHaveProperty('Source', 'baz@futurestech.com');
    expect(resp).toHaveProperty('ReplyToAddresses', [
      'replies@futurestech.com',
    ]);
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
});
