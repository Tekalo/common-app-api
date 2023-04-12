import CAPPError from '@App/resources/shared/CAPPError.js';
import { ApplicantResponseBody } from '@App/resources/types/applicants.js';
import { SessionCookie } from '@App/resources/types/shared.js';
import { Request } from 'express';

function validateCookie(req: Request) {
  if (req.session?.isPopulated) {
    if (req.session.registered === true && req.session.applicantId) {
      return true;
    }
  }
  throw new CAPPError({
    title: 'Cannot verify applicant request',
    detail: 'Applicant cannot be verified',
    status: 401,
  });
}

// TOOD: is there anything more helpful I should put in here
function setCookie(applicant: ApplicantResponseBody): SessionCookie {
  return {
    applicantId: applicant.id,
    registered: true,
  };
}

export { setCookie, validateCookie };
