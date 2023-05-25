import applyEmailHTMLTemplate from './emailHTMLTemplate.js';

const getWelcomeEmail = (changePassLink: string) => {
  const subject = 'Thanks for applying to Tekalo!';
  const content = `
    <p>
      Your assigned Tekalo Talent Connector will review your application
      and contact you via your preferred method once they have updates
      available.
    </p>
    <br />
    <p>
      In the meantime, you can sign in to your Futures Engine account by using
      your Google or LinkedIn account associated with this email address,
      or by setting up a new password for your account with the link
      below:
    </p>
    <p><a class="ulink" href="${changePassLink}"
    target="_blank">Set a new password</a> </p>`;
  return {
    subject,
    htmlBody: applyEmailHTMLTemplate(subject, content),
  };
};

export default getWelcomeEmail;
