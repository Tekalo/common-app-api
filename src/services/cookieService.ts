import CAPPError from '@App/resources/shared/CAPPError.js';
import { ApplicantResponseBody } from '@App/resources/types/applicants.js';
import { SessionCookie } from '@App/resources/types/shared.js';
import { Request } from 'express';

function validateCookie(req: Request) {
  if (req.session.applicant) {
    const pathApplicantId = +req.params.id;
    if (req.session.applicant.id === pathApplicantId) {
      return req.session.applicant.id;
    }
  }
  throw new CAPPError({
    title: 'Cannot verify applicant request',
    detail: 'Applicant cannot be verified',
    status: 401,
  });
}

function setCookie(applicant: ApplicantResponseBody): SessionCookie {
  return {
    id: applicant.id,
  };
}

export { setCookie, validateCookie };
