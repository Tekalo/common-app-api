import applyEmailTemplate from './emailTemplate.js';

const getOrgWelcomeEmail = () => {
  const subject = 'Thanks for applying to Tekalo!';
  const content = `<p>
      Your assigned Tekalo Talent Connector will review your intake form submission and contact you with next steps.
  </p>`;
  return {
    subject,
    htmlBody: applyEmailTemplate(subject, content),
  };
};

export default getOrgWelcomeEmail;
