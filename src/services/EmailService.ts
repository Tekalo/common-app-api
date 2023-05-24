import { BaseConfig } from '@App/resources/types/shared.js';
import { SendEmailCommandInput } from '@aws-sdk/client-ses';
import {
  getWelcomeEmail,
  getApplicantDeletionEmail,
  getOrgWelcomeEmail,
} from '@App/resources/emails/index.js';
import SESService from './SESService.js';

class EmailService {
  private sesService: SESService;

  private config: BaseConfig;

  constructor(sesService: SESService, config: BaseConfig) {
    this.sesService = sesService;
    this.config = config;
  }

  generateEmailTemplate({
    recipientEmail,
    subject,
    htmlBody,
    textBody,
  }: {
    recipientEmail: string;
    subject: string;
    htmlBody: string;
    textBody?: string;
  }): SendEmailCommandInput {
    const { sesFromAddress, sesReplyToAddress } = this.config.aws;
    return {
      Destination: {
        ToAddresses: [recipientEmail],
      },
      ReplyToAddresses:
        sesFromAddress === sesReplyToAddress ? undefined : [sesReplyToAddress],
      Message: {
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: htmlBody,
          },
          Text:
            textBody === undefined
              ? undefined
              : { Charset: 'UTF-8', Data: textBody },
        },
        Subject: {
          Charset: 'UTF-8',
          Data: subject,
        },
      },
      Source: sesFromAddress,
    };
  }

  generateWelcomeEmail(
    recipientEmail: string,
    changePassLink: string,
  ): SendEmailCommandInput {
    return this.generateEmailTemplate({
      ...getWelcomeEmail(changePassLink),
      recipientEmail,
    });
  }

  generateApplicantDeletionEmail(
    recipientEmail: string,
    recipientName: string,
  ): SendEmailCommandInput {
    return this.generateEmailTemplate({
      ...getApplicantDeletionEmail(recipientEmail, recipientName),
      recipientEmail,
    });
  }

  generateOrgWelcomeEmail(recipientEmail: string): SendEmailCommandInput {
    return this.generateEmailTemplate({
      ...getOrgWelcomeEmail(),
      recipientEmail,
    });
  }

  async sendEmail(emailToSend: SendEmailCommandInput) {
    const emailOutput = await this.sesService.sendEmail(emailToSend);
    return emailOutput;
  }
}

export default EmailService;
