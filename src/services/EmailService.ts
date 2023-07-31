import { SendEmailCommandInput } from '@aws-sdk/client-ses';
import { BaseConfig } from '@App/resources/types/shared.js';
import {
  getApplicantWelcomeEmail,
  getApplicantDeletionEmail,
  getApplicantDeletionCompleteEmail,
  getApplicantPostSubmitEmail,
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
    const friendlyFromAddress = `Tekalo <${sesFromAddress}>`;
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
      Source: friendlyFromAddress,
    };
  }

  generateApplicantWelcomeEmail(
    recipientEmail: string,
    changePassLink: string,
    signInLink: string,
  ): SendEmailCommandInput {
    return this.generateEmailTemplate({
      ...getApplicantWelcomeEmail(changePassLink, signInLink),
      recipientEmail,
    });
  }

  // standard email when applicant has data in database
  generateApplicantDeletionEmail(
    recipientEmail: string,
    recipientName: string,
  ): SendEmailCommandInput {
    return this.generateEmailTemplate({
      ...getApplicantDeletionEmail(recipientName),
      recipientEmail,
    });
  }

  // email if applicant just needs to be deleted from Auth0.
  // Applicant has no data in database.
  generateApplicantDeletionCompleteEmail(
    recipientEmail: string,
    recipientName: string,
  ): SendEmailCommandInput {
    return this.generateEmailTemplate({
      ...getApplicantDeletionCompleteEmail(recipientName),
      recipientEmail,
    });
  }

  generateApplicantPostSubmitEmail(
    recipientEmail: string,
  ): SendEmailCommandInput {
    return this.generateEmailTemplate({
      ...getApplicantPostSubmitEmail(),
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
