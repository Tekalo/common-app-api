import applyEmailHTMLTemplate, { ulink } from './emailHTMLTemplate.js';

const getApplicantWelcomeEmail = (
  changePassLink: string,
  signInLink: string,
) => {
  const subject = 'Thanks for creating your Tekalo account!';
  const content = `
    <p>You can <a style="${ulink}" href="${signInLink}" target="_blank">sign in to your account</a> by using your Google or LinkedIn account 
    associated with this email address, or by setting up a new password with the link below:</p>

    <p><a style="${ulink}" href="${changePassLink}"
    target="_blank">Set a new password</a>.</p>

    <p>Once you are signed in, you can head over to “My account” and click “Continue my application” 
    in order to fill out and submit your application if you haven’t done so already!</p>`;
  return {
    subject,
    htmlBody: applyEmailHTMLTemplate(subject, content),
  };
};

export default getApplicantWelcomeEmail;
