import { BaseConfig } from '@App/resources/types/shared.js';
import { SendEmailCommandInput } from '@aws-sdk/client-ses';
import getWelcomeEmail from '@App/resources/emails/welcomeEmail.js';
import SESService from './SESService.js';

class EmailService {
  private sesService: SESService;

  private config: BaseConfig;

  constructor(sesService: SESService, config: BaseConfig) {
    this.sesService = sesService;
    this.config = config;
  }

  generateWelcomeEmail(receipientEmail: string, changePassLink: string) {
    const email = getWelcomeEmail(changePassLink);
    const { sesFromAddress } = this.config.aws;
    return {
      Destination: {
        ToAddresses: [receipientEmail],
      },
      Message: {
        Body: {
          Text: {
            Charset: 'UTF-8',
            Data: 'TOOD: Style me!!!!',
          },
          Html: {
            Charset: 'UTF-8',
            Data: email,
          },
        },
        Subject: {
          Charset: 'UTF-8',
          Data: 'Hallo from Tekalo!',
        },
      },
      Source: sesFromAddress,
    };
  }

  async sendEmail(emailToSend: SendEmailCommandInput) {
    const emailOutput = await this.sesService.sendEmail(emailToSend);
    return emailOutput;
  }
}

export default EmailService;
