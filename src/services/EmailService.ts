import { BaseConfig } from '@App/resources/types/shared.js';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

class EmailService {
  private config: BaseConfig;

  constructor(config: BaseConfig) {
    this.config = config;
  }

  async sendEmail(receipientEmail: string, ticket: string) {
    const { accessKeyId, secretAccessKey, sessionToken, sesFromAddress } =
      this.config.aws;
    const sesClient = new SESClient({
      region: 'us-east-1',
      credentials: { accessKeyId, secretAccessKey, sessionToken },
    });

    const sendEmailCommand = new SendEmailCommand({
      Destination: {
        ToAddresses: [receipientEmail],
      },
      Message: {
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: `TOOD: Style me!!!!<br>
                Thanks for applying to Tekalo! Your assigned Tekalo recruiting liaison will 
                review your application and contact you via your preferred contact method once matches are available.
                In the meantime, you can sign in to your Tekalo account (<link to sign in page>) by using your Google 
                account associated with this email address, or by setting up a <a class="ulink" href="${ticket}" target="_blank">new password</a> for your account.
    
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
    });
    return sesClient.send(sendEmailCommand);
  }
}

export default EmailService;
