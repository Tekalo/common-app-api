// the aws sdk is baked into the lambda runtime and including
// the dependencies in the project will cause errors

// eslint-disable-next-line import/no-extraneous-dependencies
import { SQSEvent, SQSHandler, SQSRecord } from 'aws-lambda';
// eslint-disable-next-line import/no-extraneous-dependencies
import { SendEmailCommandInput } from '@aws-sdk/client-ses';
import SESService from './SESService.js';

const sesService = new SESService();

type EmailMessage = {
  recipientEmail: string;
  subject: string;
  htmlBody: string;
  textBody: string | undefined;
};

const processMessage = async (message: SQSRecord) => {
  try {
    const emailToSend: EmailMessage = JSON.parse(message.body) as EmailMessage;

    // todo: env variable
    const sesFromAddress = 'tekalo@dev.apps.futurestech.cloud';
    const friendlyFromAddress = `Tekalo <${sesFromAddress}>`;
    const parsedMessage: SendEmailCommandInput = {
      Destination: {
        ToAddresses: [emailToSend.recipientEmail],
      },
      // todo: env variable
      ReplyToAddresses: [sesFromAddress],
      Message: {
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: emailToSend.htmlBody,
          },
          Text:
            emailToSend.textBody === undefined
              ? undefined
              : { Charset: 'UTF-8', Data: emailToSend.textBody },
        },
        Subject: {
          Charset: 'UTF-8',
          Data: emailToSend.subject,
        },
      },
      Source: friendlyFromAddress,
    };

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
      await processMessage(record);
    }),
  );
  // eslint-disable-next-line no-console
  console.info('done');
};

export default handler;
