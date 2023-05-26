import applyEmailHTMLTemplate from './emailHTMLTemplate.js';

const getApplicantPostSubmitEmail = () => {
  const subject = 'Thanks for applying to Tekalo!';
  const content = `
    <p>
      Your assigned Tekalo Talent Connector will review your application
      and contact you via your preferred method once matches are available.
    </p>`;
  return {
    subject,
    htmlBody: applyEmailHTMLTemplate(subject, content),
  };
};

export default getApplicantPostSubmitEmail;
