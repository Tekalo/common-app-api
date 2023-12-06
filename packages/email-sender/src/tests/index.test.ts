import { jest } from '@jest/globals';
import { SQSRecord } from 'aws-lambda';
import DummySESService from './fixtures/DummySESService.js';
import { EmailMessage, generateSESInput, processMessage } from '../index.js';

describe('Email Sender Lambda', () => {
  test('should successfully generate applicant welcome email', () => {
    const emailMessage: EmailMessage = {
      recipientEmail: 'recipient@example.com',
      subject: 'Welcome to Tekalo',
      htmlBody: '<html><head></head><body><div><h1>Welcome</h1></div></body>',
      textBody: 'Welcome',
    };

    const fromAddress = 'tekalo@example.com';
    const resp = generateSESInput(emailMessage, fromAddress);

    expect(resp).toHaveProperty('Destination', {
      ToAddresses: [emailMessage.recipientEmail],
    });
    expect(resp).toHaveProperty('Source', `Tekalo <${fromAddress}>`);
    expect(resp).toHaveProperty('ReplyToAddresses', [fromAddress]);

    expect(resp).toHaveProperty('Message', {
      Subject: {
        Charset: 'UTF-8',
        Data: expect.stringMatching(emailMessage.subject),
      },
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: expect.stringContaining(emailMessage.htmlBody),
        },
        Text: {
          Charset: 'UTF-8',
          Data: expect.stringContaining(emailMessage.textBody),
        },
      },
    });
  });

  test('should successfully send welcome email', async () => {
    const dummySESService = new DummySESService();
    const mockSESSendEmailFunc = jest.spyOn(dummySESService, 'sendEmail');

    const emailMessage: EmailMessage = {
      recipientEmail: 'recipient@example.com',
      subject: 'Welcome to Tekalo',
      htmlBody: '<html><head></head><body><div><h1>Welcome</h1></div></body>',
      textBody: 'Welcome',
    };
    const sesMessage: SQSRecord = {
      messageId: 'message1',
      receiptHandle: 'AQEBwJnKyrHigUMZj6rYigCgxlaS3SLy',
      attributes: {
        ApproximateReceiveCount: '1',
        SentTimestamp: '1545082649183',
        SenderId: 'AIDAIENQZJOLO23',
        ApproximateFirstReceiveTimestamp: '1545082649185',
      },
      messageAttributes: {},
      md5OfBody: '1message',
      body: JSON.stringify(emailMessage),
      eventSource: 'aws:sqs',
      eventSourceARN: 'arn:aws:sqs:us-east-1:12345:queue',
      awsRegion: 'us-east-1',
    };
    const fromAddress = 'tekalo@dev.tekalo.io';

    const expectedEmail = generateSESInput(emailMessage, fromAddress);

    await processMessage(sesMessage, dummySESService);

    expect(mockSESSendEmailFunc).toHaveBeenCalledWith(expectedEmail);
  });
});
