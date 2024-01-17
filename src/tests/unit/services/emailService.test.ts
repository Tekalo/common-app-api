import { jest } from '@jest/globals';
import getApplicantDeletionEmail from '@App/resources/emails/applicantDeletion.js';
import getApplicantDeletionCompleteEmail from '@App/resources/emails/applicantDeletionComplete.js';
import getApplicantPostSubmitEmail from '@App/resources/emails/applicantPostSubmitEmail.js';
import getOrgWelcomeEmail from '@App/resources/emails/orgWelcomeEmail.js';
import getApplicantWelcomeEmail from '@App/resources/emails/applicantWelcomeEmail.js';
import EmailService, {
  removeAliasLowercaseEmail,
} from '@App/services/EmailService.js';
import DummySQSService from '../../fixtures/DummySQSService.js';
import { getMockConfig } from '../../util/helpers.js';

describe('Email Service', () => {
  test('should successfully generate applicant welcome email', () => {
    const sqsService = new DummySQSService();
    const emailService = new EmailService(
      sqsService,
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
    const sqsService = new DummySQSService();
    const mockSQSEnqueueEmailFunc = jest.spyOn(sqsService, 'enqueueMessage');
    const emailQueueUrl =
      'https://sqs.us-east-1.amazonaws.com/123456789/email-sqs-queue';
    const emailService = new EmailService(
      sqsService,
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
    const recipientEmail = 'foo@bar.com';

    const welcomeEmailBody = emailService.generateApplicantWelcomeEmail(
      recipientEmail,
      'fake-ticket',
      'https://login_link',
    );
    const expectedMessage = JSON.stringify({
      recipientEmail,
      subject: welcomeEmailBody.Message?.Subject?.Data,
      htmlBody: welcomeEmailBody.Message?.Body?.Html?.Data,
      textBody: welcomeEmailBody.Message?.Body?.Text?.Data,
    });
    await emailService.sendEmail(welcomeEmailBody);
    expect(mockSQSEnqueueEmailFunc).toHaveBeenCalledWith(
      emailQueueUrl,
      expectedMessage,
    );
  });

  test('should successfully generate applicant deletion email', () => {
    const emailService = new EmailService(
      new DummySQSService(),
      getMockConfig({
        aws: {
          sesFromAddress: 'baz@futurestech.com',
          sesReplyToAddress: 'replies@futurestech.com',
          region: 'us-east-1',
          sesWhiteList: [],
          emailQueueUrl:
            'https://sqs.us-east-1.amazonaws.com/123456789/email-sqs-queue',
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
    const sqsService = new DummySQSService();
    const mockSQSEnqueueEmailFunc = jest.spyOn(sqsService, 'enqueueMessage');
    const emailQueueUrl =
      'https://sqs.us-east-1.amazonaws.com/123456789/email-sqs-queue';
    const emailService = new EmailService(
      sqsService,
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
    const recipientEmail = 'foo@bar.com';
    const deletionEmailBody = emailService.generateApplicantDeletionEmail(
      recipientEmail,
      'Testy McTesterson',
    );
    await emailService.sendEmail(deletionEmailBody);
    const expectedMessage = JSON.stringify({
      recipientEmail,
      subject: deletionEmailBody.Message?.Subject?.Data,
      htmlBody: deletionEmailBody.Message?.Body?.Html?.Data,
      textBody: deletionEmailBody.Message?.Body?.Text?.Data,
    });

    expect(mockSQSEnqueueEmailFunc).toHaveBeenCalledWith(
      emailQueueUrl,
      expectedMessage,
    );
  });

  test('should successfully generate applicant deletion complete email', () => {
    const sqsService = new DummySQSService();
    const emailService = new EmailService(
      sqsService,
      getMockConfig({
        aws: {
          sesFromAddress: 'baz@futurestech.com',
          sesReplyToAddress: 'replies@futurestech.com',
          region: 'us-east-1',
          sesWhiteList: [],
          emailQueueUrl:
            'https://sqs.us-east-1.amazonaws.com/123456789/email-sqs-queue',
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
    const sqsService = new DummySQSService();
    const mockSQSEnqueueEmailFunc = jest.spyOn(sqsService, 'enqueueMessage');
    const emailQueueUrl =
      'https://sqs.us-east-1.amazonaws.com/123456789/email-sqs-queue';
    const emailService = new EmailService(
      sqsService,
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
    const recipientEmail = 'foo@bar.com';
    const deletionEmailBody =
      emailService.generateApplicantDeletionCompleteEmail(
        recipientEmail,
        'Testy McTesterson',
      );

    const expectedMessage = JSON.stringify({
      recipientEmail,
      subject: deletionEmailBody.Message?.Subject?.Data,
      htmlBody: deletionEmailBody.Message?.Body?.Html?.Data,
      textBody: deletionEmailBody.Message?.Body?.Text?.Data,
    });

    await emailService.sendEmail(deletionEmailBody);
    expect(mockSQSEnqueueEmailFunc).toHaveBeenCalledWith(
      emailQueueUrl,
      expectedMessage,
    );
  });

  test('should successfully generate application submit email', () => {
    const sqsService = new DummySQSService();
    const emailService = new EmailService(
      sqsService,
      getMockConfig({
        aws: {
          sesFromAddress: 'baz@futurestech.com',
          sesReplyToAddress: 'replies@futurestech.com',
          region: 'us-east-1',
          sesWhiteList: [],
          emailQueueUrl:
            'https://sqs.us-east-1.amazonaws.com/123456789/email-sqs-queue',
        },
        env: 'prod',
      }),
    );
    const result = emailService.generateApplicantPostSubmitEmail('foo@bar.com');
    const expectedEmail = getApplicantPostSubmitEmail();
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

  test('should successfully send application submit email', async () => {
    const sqsService = new DummySQSService();
    const mockSQSEnqueueEmailFunc = jest.spyOn(sqsService, 'enqueueMessage');
    const emailQueueUrl =
      'https://sqs.us-east-1.amazonaws.com/123456789/email-sqs-queue';
    const emailService = new EmailService(
      sqsService,
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
    const recipientEmail = 'foo@bar.com';
    const submitEmailBody =
      emailService.generateApplicantPostSubmitEmail(recipientEmail);
    await emailService.sendEmail(submitEmailBody);
    const expectedMessage = JSON.stringify({
      recipientEmail,
      subject: submitEmailBody.Message?.Subject?.Data,
      htmlBody: submitEmailBody.Message?.Body?.Html?.Data,
      textBody: submitEmailBody.Message?.Body?.Text?.Data,
    });
    expect(mockSQSEnqueueEmailFunc).toHaveBeenCalledWith(
      emailQueueUrl,
      expectedMessage,
    );
  });

  test('should successfully generate org welcome email', () => {
    const emailService = new EmailService(
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
    const sqsService = new DummySQSService();
    const mockSQSEnqueueEmailFunc = jest.spyOn(sqsService, 'enqueueMessage');
    const emailQueueUrl =
      'https://sqs.us-east-1.amazonaws.com/123456789/email-sqs-queue';
    const emailService = new EmailService(
      sqsService,
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
    const recipientEmail = 'foo@bar.com';
    const welcomeEmailBody =
      emailService.generateOrgWelcomeEmail(recipientEmail);

    const expectedMessage = JSON.stringify({
      recipientEmail,
      subject: welcomeEmailBody.Message?.Subject?.Data,
      htmlBody: welcomeEmailBody.Message?.Body?.Html?.Data,
      textBody: welcomeEmailBody.Message?.Body?.Text?.Data,
    });
    await emailService.sendEmail(welcomeEmailBody);
    expect(mockSQSEnqueueEmailFunc).toHaveBeenCalledWith(
      emailQueueUrl,
      expectedMessage,
    );
  });
});

describe('Email Service sending to SQS queue', () => {
  test('should send email as a message to email sender SQS queue', async () => {
    const dummySQSService = new DummySQSService();
    const mockSQSEnqueueEmailFunc = jest.spyOn(
      dummySQSService,
      'enqueueMessage',
    );
    const emailQueueUrl =
      'https://sqs.us-east-1.amazonaws.com/12345/email-sender-queue';
    const recipientEmail = 'foo@bar.com';
    const emailService = new EmailService(
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
    expect(mockSQSEnqueueEmailFunc).toHaveBeenCalledWith(
      emailQueueUrl,
      expectedMessage,
    );
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
