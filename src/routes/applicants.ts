import ApplicantController from '@App/controllers/ApplicantController.js';
import {
  ApplicantRequestBodySchema,
  ApplicantSubmissionRequestBodySchema,
  ApplicantDraftSubmissionRequestBodySchema,
} from '@App/resources/schemas/applicants.js';
import {
  ApplicantRequestBody,
  ApplicantSubmissionBody,
  ApplicantDraftSubmissionBody,
} from '@App/resources/types/applicants.js';
import { validateCookie, setCookie } from '@App/services/cookieService.js';

import AuthService from '@App/services/AuthService.js';
import prisma from '@App/resources/client.js';
import express, { NextFunction, Request, Response } from 'express';
import { verifyJwt } from '@App/middleware/Authenticator.js';
import CAPPError from '@App/resources/shared/CAPPError.js';

const applicantRoutes = (authService: AuthService) => {
  const router = express.Router();
  const applicantController = new ApplicantController(authService, prisma);

  router.post('/', (req: Request, res: Response, next) => {
    const appBody = req.body as ApplicantRequestBody;
    const validatedBody = ApplicantRequestBodySchema.parse(appBody);
    applicantController
      .createApplicant(validatedBody)
      .then((result) => {
        req.session.applicant = setCookie(result);
        res.status(200).json(result);
      })
      .catch((err) => next(err));
  });

  router.post('/:id/submissions', (req: Request, res: Response, next) => {
    const appBody = req.body as ApplicantSubmissionBody;
    const applicantID = +req.params.id;
    const validatedBody = ApplicantSubmissionRequestBodySchema.parse(appBody);
    applicantController
      .createSubmission(applicantID, validatedBody)
      .then((result) => {
        res.status(200).json(result);
      })
      .catch((err) => next(err));
  });

  router.delete('/:id', (req: Request, res: Response, next) => {
    const applicantID = +req.params.id;
    applicantController
      .deleteApplicant(applicantID)
      .then((result) => {
        res.status(200).json(result);
      })
      .catch((err) => next(err));
  });

  router.post('/:id/submissions/draft', (req: Request, res: Response, next) => {
    const applicantID = validateCookie(req);
    const appBody = req.body as ApplicantDraftSubmissionBody;
    const validatedBody =
      ApplicantDraftSubmissionRequestBodySchema.parse(appBody);
    applicantController
      .createOrUpdateDraftSubmission(applicantID, validatedBody)
      .then((result) => {
        res.status(200).json(result);
      })
      .catch((err) => next(err));
  });

  router.get(
    '/me/submissions',
    verifyJwt,
    (req: Request, res: Response, next: NextFunction) => {
      if (!req.auth) {
        throw new CAPPError({
          title: 'Unauthorized',
          detail: 'Could not authenticate user',
          status: 401,
        });
      }

      const { payload } = req.auth;
      applicantController
        .getMySubmissions(payload['auth0.capp.com/email'])
        .then((result) => {
          res.status(200).json(result);
        })
        .catch((err) => next(err));
    },
  );

  return router;
};

export default applicantRoutes;
