import CAPPError from '@App/resources/shared/CAPPError.js';
import { ApplicantResponseBody } from '@App/resources/types/applicants.js';
import { SessionCookie } from '@App/resources/types/shared.js';
import { Request } from 'express';

function verifyCookie(req: Request) {
  if (!req.session.applicant || !req.session.applicant.id) {
    throw new CAPPError({
      title: 'Cannot authenticate request',
      detail: 'Applicant cannot be authenticated',
      status: 401,
    });
  }
}

function setCookie(applicant: ApplicantResponseBody): SessionCookie {
  return { id: applicant.id };
}

export { setCookie, verifyCookie };
