import {
  SendEmailCommand,
  SendEmailCommandInput,
  SendEmailCommandOutput,
  SESClient,
} from '@aws-sdk/client-ses';

class SESService {
  static getSESClient() {
    return new SESClient({});
  }

  /* eslint-disable class-methods-use-this */
  async sendEmail(
    emailBody: SendEmailCommandInput,
  ): Promise<SendEmailCommandOutput> {
    const sesClient = SESService.getSESClient();
    const sendEmailCommand = new SendEmailCommand(emailBody);
    return sesClient.send(sendEmailCommand);
  }
}

export default SESService;
