import applyEmailHTMLTemplate from './emailHTMLTemplate.js';

const getApplicantDeletionCompleteEmail = (recipientName: string) => {
  const subject = 'Confirming your data deletion request';
  const content = `
    <p> Hi ${recipientName},
    <br>
    <p>We have processed your request for erasure of your personal data.</p>
    <p>Please note that we must retain certain data as necessary to comply with our legal obligations, 
    such as to maintain records of this request and any other requests you have made in regards to your data. We 
    may also retain data if necessary for the establishment, exercise or defense of legal claims or to exercise the 
    right of freedom of expression and information.</p>
    <p>Except as noted above, your personal data has been erased from all live systems we operate. We have directed all 
    third parties processing your personal data on our behalf to delete your data as well.</p>
    <p>We hope to see you again in the future!</p>`;
  return {
    subject,
    htmlBody: applyEmailHTMLTemplate(subject, content),
  };
};

export default getApplicantDeletionCompleteEmail;
