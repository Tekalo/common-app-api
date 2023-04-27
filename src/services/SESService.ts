import { BaseConfig } from '@App/resources/types/shared.js';
import {
  SendEmailCommand,
  SendEmailCommandInput,
  SendEmailCommandOutput,
  SESClient,
} from '@aws-sdk/client-ses';

class SESService {
  private config: BaseConfig;

  constructor(config: BaseConfig) {
    this.config = config;
  }

  getSESClient(): SESClient {
    const { region } = this.config.aws;
    return new SESClient({
      region,
    });
  }

  async sendEmail(
    emailBody: SendEmailCommandInput,
  ): Promise<SendEmailCommandOutput> {
    const sesClient = this.getSESClient();
    const sendEmailCommand = new SendEmailCommand(emailBody);
    return sesClient.send(sendEmailCommand);
  }
}

export default SESService;
