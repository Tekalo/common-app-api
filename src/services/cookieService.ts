import { Request } from 'express';
import CAPPError from '@App/resources/shared/CAPPError.js';
import { ApplicantResponseBody } from '@App/resources/types/applicants.js';
import { IdOnly } from '@App/resources/types/shared.js';

function verifyCookie(req: Request) {
  if (!req.session.applicant || !req.session.applicant.id) {
    throw new CAPPError({
      title: 'Cannot authenticate request',
      detail: 'Applicant cannot be authenticated',
      status: 401,
    });
  }
}

function setCookie(applicant: ApplicantResponseBody): IdOnly {
  return { id: applicant.id };
}

export { setCookie, verifyCookie };
