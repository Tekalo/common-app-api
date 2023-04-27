import { BaseConfig } from '@App/resources/types/shared.js';
import { SendEmailCommandInput } from '@aws-sdk/client-ses';
import SESService from './SESService.js';

class EmailService {
  private sesService: SESService;

  private config: BaseConfig;

  constructor(sesService: SESService, config: BaseConfig) {
    this.sesService = sesService;
    this.config = config;
  }

  generateWelcomeEmail(receipientEmail: string, changePassLink: string) {
    const { sesFromAddress } = this.config.aws;
    return {
      Destination: {
        ToAddresses: [receipientEmail],
      },
      Message: {
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: `TOOD: Style me!!!!<br>
                Thanks for applying to Tekalo! Your assigned Tekalo Talent Connector will 
                review your application and contact you via your preferred contact method once matches are available.
                In the meantime, you can sign in to your Tekalo account (<link to sign in page>) by using your Google 
                or LinkedIn account associated with this email address, or by setting up a <a class="ulink" href="${changePassLink}" 
                target="_blank">new password</a> for your account.
    
                Thanks,
                The Tekalo team`,
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
    return this.sesService.sendEmail(emailToSend);
  }
}

export default EmailService;
