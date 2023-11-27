import {
  SendMessageCommand,
  SendMessageCommandOutput,
  SQSClient,
} from '@aws-sdk/client-sqs';

class SQSService {
  static getSQSClient() {
    return new SQSClient({});
  }

  /* eslint-disable class-methods-use-this */
  async enqueueMessage(
    queueUrl: string,
    message: string,
  ): Promise<SendMessageCommandOutput> {
    const sqsClient = SQSService.getSQSClient();
    const sendMessageCommand = new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: message,
    });
    return sqsClient.send(sendMessageCommand);
  }
}

export default SQSService;
