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

// Please add/delete the desired email addresses here
const sesWhiteList = ['bboberson@gmail.com'];
// Use hashset for quicker lookup
const sesWhiteListSet = new Set(sesWhiteList);

// shall process roger+123ty@gmail.com into roger@gmail.com
function processEmail(email: any): string {
  // Turn email to lowercase
  email = email.toLowerCase();
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

  // for testing
  emailVerified() {

  }

  async sendEmail(emailToSend: SendEmailCommandInput) {
    const email: string | undefined = emailToSend.Destination?.ToAddresses?.[0];
    const processedEmail = processEmail(email);
    console.log(processedEmail);
    if (sesWhiteListSet.has(processedEmail)) {
      console.log('you entered');
      this.emailVerified();
      const emailOutput = await this.sesService.sendEmail(emailToSend);
      return emailOutput;
    }
  }
}

export default EmailService;
