import {
  SendEmailCommandInput,
  SendEmailCommandOutput,
} from '@aws-sdk/client-ses';
import { BaseConfig } from '@App/resources/types/shared.js';
import {
  getApplicantWelcomeEmail,
  getApplicantDeletionEmail,
  getApplicantDeletionCompleteEmail,
  getApplicantPostSubmitEmail,
  getOrgWelcomeEmail,
} from '@App/resources/emails/index.js';
import SESService from './SESService.js';

// shall process roger+123ty@gmail.com into roger@gmail.com
export function removeAliasLowercaseEmail(emailRaw: string): string {
  // Turn email to lowercase
  const email = emailRaw.toLowerCase();
  // Use a regular expression to match the email pattern
  const regex = /^(.+)@(.+)$/;
  const matchRes = email.match(regex);

  let retEmail = '';
  if (matchRes) {
    const [, localPart, domain] = matchRes; // whole email, left of @, right of @
    const processedEmail = `${localPart.split('+')[0]}@${domain}`;
    retEmail = processedEmail;
  } else {
    // Invalid email format, return the original email
    retEmail = email;
  }

  return retEmail;
}

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

  /* eslint-disable consistent-return */
  async sendEmail(
    emailToSend: SendEmailCommandInput,
  ): Promise<void | SendEmailCommandOutput> {
    const { sesWhiteList } = this.config.aws;
    // Use hashset for quicker lookup
    const sesWhiteListSet = new Set(sesWhiteList);

    if (emailToSend.Destination?.ToAddresses !== undefined) {
      for (let i = 0; i < emailToSend.Destination.ToAddresses.length; i += 1) {
        const email = emailToSend.Destination.ToAddresses[i];
        if (this.config.useEmailWhiteList) {
          const processedEmail = removeAliasLowercaseEmail(email);
          if (!sesWhiteListSet.has(processedEmail)) {
            emailToSend.Destination.ToAddresses.splice(i, 1);
          }
        }
      }

      if (emailToSend.Destination.ToAddresses.length !== 0) {
        const emailOutput = await this.sesService.sendEmail(emailToSend);
        return emailOutput;
      }
    }
  }
}

export default EmailService;
