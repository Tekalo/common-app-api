// eslint-disable-next-line import/no-extraneous-dependencies
import { SQSEvent, SQSHandler, SQSRecord } from 'aws-lambda';
// import { SendEmailCommandInput } from '@aws-sdk/client-ses';
// import SESService from './SESService.js';

// const sesService = new SESService();

const processMessage = (message: SQSRecord) => {
  try {
    // eslint-disable-next-line no-console
    console.log(`Processed message ${message.body}`);
    // const parsedMessage: SendEmailCommandInput = JSON.parse(
    //   message.body,
    // ) as SendEmailCommandInput;

    // return await sesService.sendEmail(parsedMessage);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('There was a problem');
    throw err;
  }
};

export const handler: SQSHandler = (event: SQSEvent) => {
  processMessage(event.Records[0]);
  // eslint-disable-next-line no-console
  console.info('done');
};

export default handler;
