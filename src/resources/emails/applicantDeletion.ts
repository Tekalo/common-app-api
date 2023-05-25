import applyEmailHTMLTemplate from './emailHTMLTemplate.js';

const getApplicantDeletionEmail = (recipientName: string) => {
  const subject = 'Confirming your data deletion request';
  const content = `
    <p> Hi ${recipientName},
    <br>
    <p> Thank you for contacting Tekalo.</p>
    <p>We hereby confirm that we have received your data deletion request.
    We are currently processing your request and will be updating you as soon as possible.
    Note that by deleting your data you will no longer receive new matches via the Tekalo platform.
    </p>`;
  return {
    subject,
    htmlBody: applyEmailHTMLTemplate(subject, content),
  };
};

export default getApplicantDeletionEmail;
