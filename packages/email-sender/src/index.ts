// the aws sdk is baked into the lambda runtime and including
// the dependencies in the project will cause errors

// eslint-disable-next-line import/no-extraneous-dependencies
import { SQSEvent, SQSHandler, SQSRecord } from 'aws-lambda';
// eslint-disable-next-line import/no-extraneous-dependencies
import { SendEmailCommandInput } from '@aws-sdk/client-ses';
import SESService from './SESService.js';

const SES_SERVICE = new SESService();
export const SES_FROM_ADDRESS =
  process.env.SES_FROM_ADDRESS || 'tekalo@dev.tekalo.io';

export type EmailMessage = {
  recipientEmail: string;
  subject: string;
  htmlBody: string;
  textBody: string | undefined;
};

export const generateSESInput = (
  message: EmailMessage,
  sesFromAddress: string,
): SendEmailCommandInput => {
  const friendlyFromAddress = `Tekalo <${sesFromAddress}>`;
  return {
    Destination: {
      ToAddresses: [message.recipientEmail],
    },
    ReplyToAddresses: [sesFromAddress],
    Message: {
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: message.htmlBody,
        },
        Text:
          message.textBody === undefined
            ? undefined
            : { Charset: 'UTF-8', Data: message.textBody },
      },
      Subject: {
        Charset: 'UTF-8',
        Data: message.subject,
      },
    },
    Source: friendlyFromAddress,
  };
};

export const processMessage = async (
  message: SQSRecord,
  sesService: SESService,
) => {
  try {
    const emailToSend: EmailMessage = JSON.parse(message.body) as EmailMessage;

    const parsedMessage = generateSESInput(emailToSend, SES_FROM_ADDRESS);

    return await sesService.sendEmail(parsedMessage);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('There was a problem');
    throw err;
  }
};

export const handler: SQSHandler = async (event: SQSEvent) => {
  await Promise.all(
    event.Records.map(async (record) => {
      await processMessage(record, SES_SERVICE);
    }),
  );
  // eslint-disable-next-line no-console
  console.info('done');
};

export default handler;
