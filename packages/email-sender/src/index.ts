// the aws sdk is baked into the lambda runtime and including
// the dependencies in the project will cause errors

// eslint-disable-next-line import/no-extraneous-dependencies
import { SQSEvent, SQSHandler, SQSRecord } from 'aws-lambda';
// eslint-disable-next-line import/no-extraneous-dependencies
import { SendEmailCommandInput } from '@aws-sdk/client-ses';
import SESService from './SESService.js';

const sesService = new SESService();

const processMessage = async (message: SQSRecord) => {
  try {
    // eslint-disable-next-line no-console
    const emailToSend = message.body;
    console.log(`Processed message ${emailToSend}`);
    // const parsedMessage: SendEmailCommandInput = JSON.parse(
    //   message.body,
    // ) as SendEmailCommandInput;

    const htmlBody =
      '<html><head></head><body><h1>Thank you for creating your Futures Engine account!</h1></body></html>';
    const parsedMessage: SendEmailCommandInput = {
      Destination: {
        ToAddresses: ['aarmentrout@schmidtfutures.com'],
      },
      ReplyToAddresses: ['replies@futurestech.com'],
      Message: {
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: htmlBody,
          },
          Text: undefined,
        },
        Subject: {
          Charset: 'UTF-8',
          Data: 'Thanks for creating your Futures Engine account!',
        },
      },
      Source: 'Tekalo <tekalo@dev.apps.futurestech.cloud>',
    };

    return await sesService.sendEmail(parsedMessage);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('There was a problem');
    throw err;
  }
};

export const handler: SQSHandler = async (event: SQSEvent) => {
  await processMessage(event.Records[0]);
  // eslint-disable-next-line no-console
  console.info('done');
};

export default handler;
