// eslint-disable-next-line import/no-extraneous-dependencies
import { SQSEvent, SQSHandler, SQSRecord } from 'aws-lambda';

function processMessage(message: SQSRecord) {
  try {
    console.log(`Processed message ${message.body}`);
    // Do something here
  } catch (err) {
    console.error('There was a problem');
    throw err;
  }
}

const handler: SQSHandler = (event: SQSEvent) => {
  event.Records.forEach((record) => {
    processMessage(record);
  });
  console.info('done');
};

export default handler;
