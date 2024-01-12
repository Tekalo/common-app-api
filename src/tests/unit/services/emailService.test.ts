import { jest } from '@jest/globals';
import getApplicantDeletionEmail from '@App/resources/emails/applicantDeletion.js';
import getApplicantDeletionCompleteEmail from '@App/resources/emails/applicantDeletionComplete.js';
import getOrgWelcomeEmail from '@App/resources/emails/orgWelcomeEmail.js';
import getApplicantWelcomeEmail from '@App/resources/emails/applicantWelcomeEmail.js';
import EmailService, {
  removeAliasLowercaseEmail,
} from '@App/services/EmailService.js';
import DummySESService from '../../fixtures/DummySESService.js';
import DummySQSService from '../../fixtures/DummySQSService.js';
import { getMockConfig } from '../../util/helpers.js';

describe('Email Service', () => {
  test('should successfully generate applicant welcome email', () => {
    const dummySesService = new DummySESService();
    const emailService = new EmailService(
      dummySesService,
      new DummySQSService(),
      getMockConfig({
        aws: {
          sesFromAddress: 'baz@futurestech.com',
          sesReplyToAddress: 'replies@futurestech.com',
          region: 'us-east-1',
          sesWhiteList: [],
          emailQueueUrl: '',
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
    expect(resp).toHaveProperty('Source', 'Tekalo <baz@futurestech.com>');
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
          Data: expect.stringContaining(expectedEmail.htmlBody),
        },
      },
    });
  });

  test('should successfully send welcome email', async () => {
    const dummySesService = new DummySESService();
    const mockSesSendEmailFunc = jest.spyOn(dummySesService, 'sendEmail');
    const emailService = new EmailService(
      dummySesService,
      new DummySQSService(),
      getMockConfig({
        aws: {
          sesFromAddress: 'baz@futurestech.com',
          sesReplyToAddress: 'replies@futurestech.com',
          region: 'us-east-1',
          sesWhiteList: [],
          emailQueueUrl: '',
        },
        env: 'prod',
      }),
    );
    const welcomeEmailBody = emailService.generateApplicantWelcomeEmail(
      'foo@bar.com',
      'fake-ticket',
      'https://login_link',
    );
    await emailService.sendEmail(welcomeEmailBody);
    expect(mockSesSendEmailFunc).toHaveBeenCalledWith(welcomeEmailBody);
  });

  test('should successfully generate applicant deletion email', () => {
    const dummySesService = new DummySESService();
    const emailService = new EmailService(
      dummySesService,
      new DummySQSService(),
      getMockConfig({
        aws: {
          sesFromAddress: 'baz@futurestech.com',
          sesReplyToAddress: 'replies@futurestech.com',
          region: 'us-east-1',
          sesWhiteList: [],
          emailQueueUrl: '',
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
    expect(result).toHaveProperty('Source', 'Tekalo <baz@futurestech.com>');
    expect(result).toHaveProperty('Message', {
      Subject: {
        Charset: 'UTF-8',
        Data: expect.stringMatching(expectedEmail.subject),
      },
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: expect.stringContaining(expectedEmail.htmlBody),
        },
      },
    });
  });

  test('should successfully send applicant deletion email', async () => {
    const dummySesService = new DummySESService();
    const mockSesSendEmailFunc = jest.spyOn(dummySesService, 'sendEmail');
    const emailService = new EmailService(
      dummySesService,
      new DummySQSService(),
      getMockConfig({
        aws: {
          sesFromAddress: 'baz@futurestech.com',
          sesReplyToAddress: 'replies@futurestech.com',
          region: 'us-east-1',
          sesWhiteList: [],
          emailQueueUrl: '',
        },
        env: 'prod',
      }),
    );
    const deletionEmailBody = emailService.generateApplicantDeletionEmail(
      'foo@bar.com',
      'Testy McTesterson',
    );
    await emailService.sendEmail(deletionEmailBody);
    expect(mockSesSendEmailFunc).toHaveBeenCalledWith(deletionEmailBody);
  });

  test('should successfully generate applicant deletion complete email', () => {
    const dummySesService = new DummySESService();
    const emailService = new EmailService(
      dummySesService,
      new DummySQSService(),
      getMockConfig({
        aws: {
          sesFromAddress: 'baz@futurestech.com',
          sesReplyToAddress: 'replies@futurestech.com',
          region: 'us-east-1',
          sesWhiteList: [],
          emailQueueUrl: '',
        },
      }),
    );
    const result = emailService.generateApplicantDeletionCompleteEmail(
      'foo@bar.com',
      'Robin Williams',
    );
    const expectedEmail = getApplicantDeletionCompleteEmail('Robin Williams');
    expect(result).toHaveProperty('Destination', {
      ToAddresses: ['foo@bar.com'],
    });
    expect(result).toHaveProperty('Source', 'Tekalo <baz@futurestech.com>');
    expect(result).toHaveProperty('Message', {
      Subject: {
        Charset: 'UTF-8',
        Data: expect.stringMatching(expectedEmail.subject),
      },
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: expect.stringContaining(expectedEmail.htmlBody),
        },
      },
    });
  });

  test('should successfully send applicant deletion complete email', async () => {
    const dummySesService = new DummySESService();
    const mockSesSendEmailFunc = jest.spyOn(dummySesService, 'sendEmail');
    const emailService = new EmailService(
      dummySesService,
      new DummySQSService(),
      getMockConfig({
        aws: {
          sesFromAddress: 'baz@futurestech.com',
          sesReplyToAddress: 'replies@futurestech.com',
          region: 'us-east-1',
          sesWhiteList: [],
          emailQueueUrl: undefined,
        },
        env: 'prod',
      }),
    );
    const deletionEmailBody =
      emailService.generateApplicantDeletionCompleteEmail(
        'foo@bar.com',
        'Testy McTesterson',
      );
    await emailService.sendEmail(deletionEmailBody);
    expect(mockSesSendEmailFunc).toBeCalledWith(deletionEmailBody);
  });

  test('should successfully generate application submit email', async () => {
    const dummySesService = new DummySESService();
    const mockSesSendEmailFunc = jest.spyOn(dummySesService, 'sendEmail');
    const emailService = new EmailService(
      dummySesService,
      new DummySQSService(),
      getMockConfig({
        aws: {
          sesFromAddress: 'baz@futurestech.com',
          sesReplyToAddress: 'replies@futurestech.com',
          region: 'us-east-1',
          sesWhiteList: [],
        },
        env: 'prod',
      }),
    );
    const postSubmitEmailBody =
      emailService.generateApplicantPostSubmitEmail('foo@bar.com');
    await emailService.sendEmail(postSubmitEmailBody);
    expect(mockSesSendEmailFunc).toHaveBeenCalledWith(postSubmitEmailBody);
  });

  test('should successfully send application submit email', async () => {
    const dummySesService = new DummySESService();
    const mockSesSendEmailFunc = jest.spyOn(dummySesService, 'sendEmail');
    const emailService = new EmailService(
      dummySesService,
      new DummySQSService(),
      getMockConfig({
        aws: {
          sesFromAddress: 'baz@futurestech.com',
          sesReplyToAddress: 'replies@futurestech.com',
          region: 'us-east-1',
          sesWhiteList: [],
        },
        env: 'prod',
      }),
    );
    const submitEmailBody =
      emailService.generateApplicantPostSubmitEmail('foo@bar.com');
    await emailService.sendEmail(submitEmailBody);
    expect(mockSesSendEmailFunc).toHaveBeenCalledWith(submitEmailBody);
  });

  test('should successfully generate org welcome email', () => {
    const dummySesService = new DummySESService();
    const emailService = new EmailService(
      dummySesService,
      new DummySQSService(),
      getMockConfig({
        aws: {
          sesFromAddress: 'baz@futurestech.com',
          sesReplyToAddress: 'replies@futurestech.com',
          region: 'us-east-1',
          sesWhiteList: [],
        },
      }),
    );
    const resp = emailService.generateOrgWelcomeEmail('foo@bar.com');
    const expectedEmail = getOrgWelcomeEmail();
    expect(resp).toHaveProperty('Destination', {
      ToAddresses: ['foo@bar.com'],
    });
    expect(resp).toHaveProperty('Source', 'Tekalo <baz@futurestech.com>');
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
          Data: expect.stringContaining(expectedEmail.htmlBody),
        },
      },
    });
  });

  test('should successfully send org welcome email', async () => {
    const dummySesService = new DummySESService();
    const mockSesSendEmailFunc = jest.spyOn(dummySesService, 'sendEmail');
    const emailService = new EmailService(
      dummySesService,
      new DummySQSService(),
      getMockConfig({
        aws: {
          sesFromAddress: 'baz@futurestech.com',
          sesReplyToAddress: 'replies@futurestech.com',
          region: 'us-east-1',
          sesWhiteList: [],
        },
        env: 'prod',
      }),
    );
    const welcomeEmailBody =
      emailService.generateOrgWelcomeEmail('foo@bar.com');
    await emailService.sendEmail(welcomeEmailBody);
    expect(mockSesSendEmailFunc).toHaveBeenCalledWith(welcomeEmailBody);
  });
});

describe('Email Service sending to SQS queue', () => {
  test('should send email as a message to email sender SQS queue when queue is configured', async () => {
    const dummySesService = new DummySESService();
    const dummySQSService = new DummySQSService();
    const mockSesSendEmailFunc = jest.spyOn(dummySesService, 'sendEmail');
    const mockSQSSendEmailFunc = jest.spyOn(dummySQSService, 'enqueueMessage');
    const emailQueueUrl =
      'https://sqs.us-east-1.amazonaws.com/12345/email-sender-queue';
    const recipientEmail = 'foo@bar.com';
    const emailService = new EmailService(
      dummySesService,
      dummySQSService,
      getMockConfig({
        aws: {
          sesFromAddress: 'baz@futurestech.com',
          sesReplyToAddress: 'replies@futurestech.com',
          region: 'us-east-1',
          sesWhiteList: [],
          emailQueueUrl,
        },
        env: 'prod',
      }),
    );
    const welcomeEmailBody =
      emailService.generateOrgWelcomeEmail(recipientEmail);
    const expectedMessage = JSON.stringify({
      recipientEmail,
      subject: welcomeEmailBody.Message?.Subject?.Data,
      htmlBody: welcomeEmailBody.Message?.Body?.Html?.Data,
      textBody: welcomeEmailBody.Message?.Body?.Text?.Data,
    });
    await emailService.sendEmail(welcomeEmailBody);
    expect(mockSesSendEmailFunc).not.toHaveBeenCalled();
    expect(mockSQSSendEmailFunc).toHaveBeenCalledWith(
      emailQueueUrl,
      expectedMessage,
    );
  });

  test('should send email directly via SES when email sender SQS queue is not configured', async () => {
    const dummySesService = new DummySESService();
    const dummySQSService = new DummySQSService();
    const mockSesSendEmailFunc = jest.spyOn(dummySesService, 'sendEmail');
    const mockSQSSendEmailFunc = jest.spyOn(dummySQSService, 'enqueueMessage');
    const emailService = new EmailService(
      dummySesService,
      dummySQSService,
      getMockConfig({
        aws: {
          sesFromAddress: 'baz@futurestech.com',
          sesReplyToAddress: 'replies@futurestech.com',
          region: 'us-east-1',
          sesWhiteList: [],
        },
        env: 'prod',
      }),
    );
    const welcomeEmailBody =
      emailService.generateOrgWelcomeEmail('foo@bar.com');
    await emailService.sendEmail(welcomeEmailBody);
    expect(mockSesSendEmailFunc).toHaveBeenCalledWith(welcomeEmailBody);
    expect(mockSQSSendEmailFunc).not.toHaveBeenCalled();
  });
});

describe('should lowercase email addresses and remove the right part of +', () => {
  const arrInput = [
    'Aboberson@tekalo.org',
    'bboberson+123xyz@gmail.com',
    'bBoBerson+321zyx@tekalo.org',
  ];
  const arrOutput = [
    'aboberson@tekalo.org',
    'bboberson@gmail.com',
    'bboberson@tekalo.org',
  ];

  it.each(arrInput)("test '%s'", (input) => {
    const index = arrInput.indexOf(input);
    const expectedOutput = arrOutput[index];
    const result = removeAliasLowercaseEmail(input);
    expect(result).toBe(expectedOutput);
  });
});
