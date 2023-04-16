import CAPPError from '@App/resources/shared/CAPPError.js';
import { ApplicantResponseBody } from '@App/resources/types/applicants.js';
import { SessionCookie } from '@App/resources/types/shared.js';
import { NextFunction, Request, Response } from 'express';

function validateCookie(req: Request, res: Response, next: NextFunction) {
  // check if request's applicant id matches id inside the cookie
  if (req.session.applicant) {
    const pathApplicantId = +req.params.id;
    if (req.session.applicant.id === pathApplicantId) {
      next();
      return;
    }
  }
  next(
    new CAPPError({
      title: 'Cannot verify applicant request',
      detail: 'Applicant cannot be verified',
      status: 401,
    }),
  );
}

function setCookie(applicant: ApplicantResponseBody): SessionCookie {
  return { id: applicant.id };
}

export { setCookie, validateCookie };
