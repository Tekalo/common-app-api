import ApplicantController from '@App/controllers/ApplicantController.js';
import {
  ApplicantRequestBodySchema,
  ApplicantSubmissionRequestBodySchema,
  ApplicantDraftSubmissionRequestBodySchema,
  ApplicantStateRequestBodySchema,
} from '@App/resources/schemas/applicants.js';
import {
  ApplicantRequestBody,
  ApplicantSubmissionBody,
  ApplicantDraftSubmissionBody,
  ApplicantStateBody,
} from '@App/resources/types/applicants.js';
import { setCookie } from '@App/services/cookieService.js';

import AuthService from '@App/services/AuthService.js';
import prisma from '@App/resources/client.js';
import express, { NextFunction, Request, Response } from 'express';
import Authenticator from '@App/middleware/authenticator.js';
import { RequestWithJWT } from '@App/resources/types/auth0.js';
import EmailService from '@App/services/EmailService.js';
import MonitoringService from '@App/services/MonitoringService.js';
import { BaseConfig } from '@App/resources/types/shared.js';

const applicantRoutes = (
  authService: AuthService,
  emailService: EmailService,
  monitoringService: MonitoringService,
  config: BaseConfig,
) => {
  const router = express.Router();
  const applicantController = new ApplicantController(
    authService,
    prisma,
    emailService,
    monitoringService,
  );
  const authenticator = new Authenticator(prisma, config.auth0.express);

  router.post(
    '/',
    authenticator.attachJwt.bind(authenticator),
    (req: Request, res: Response, next) => {
      const appBody = req.body as ApplicantRequestBody;
      const validatedBody = ApplicantRequestBodySchema.parse(appBody);
      applicantController
        .createApplicant(validatedBody, req.auth)
        .then((result) => {
          req.session.applicant = setCookie(result);
          res.status(200).json(result);
        })
        .catch((err) => next(err));
    },
  );

  router.post(
    '/me/submissions',
    authenticator.verifyJwtOrCookie.bind(authenticator),
    (req: Request, res: Response, next) => {
      const appBody = req.body as ApplicantSubmissionBody;
      const validatedBody = ApplicantSubmissionRequestBodySchema.parse(appBody);
      const applicantID = req.auth?.payload.id || req.session.applicant.id;
      applicantController
        .createSubmission(applicantID, validatedBody)
        .then((result) => {
          res.status(200).json(result);
        })
        .catch((err) => next(err));
    },
  );

  router.put(
    '/me/state',
    authenticator.validateJwt.bind(authenticator),
    (req: Request, res: Response, next) => {
      const appBody = req.body as ApplicantStateBody;
      const reqWithAuth = req as RequestWithJWT;
      const applicantID = reqWithAuth.auth.payload.id;
      const { pause } = ApplicantStateRequestBodySchema.parse(appBody);
      applicantController
        .pauseApplicant(applicantID, pause)
        .then((result) => {
          res.status(200).json(result);
        })
        .catch((err) => next(err));
    },
  );

  router.delete(
    '/me',
    authenticator.validateJwt.bind(authenticator),
    (req: Request, res: Response, next) => {
      const reqWithAuth = req as RequestWithJWT;
      const { id } = reqWithAuth.auth.payload;
      applicantController
        .deleteApplicant(id)
        .then((result) => {
          res.status(200).json(result);
        })
        .catch((err) => next(err));
    },
  );

  router.post(
    '/me/submissions/draft',
    authenticator.verifyJwtOrCookie.bind(authenticator),
    (req: Request, res: Response, next) => {
      const appBody = req.body as ApplicantDraftSubmissionBody;
      const applicantID = req.auth?.payload.id || req.session.applicant.id;
      const validatedBody =
        ApplicantDraftSubmissionRequestBodySchema.parse(appBody);
      applicantController
        .createOrUpdateDraftSubmission(applicantID, validatedBody)
        .then((result) => {
          res.status(200).json(result);
        })
        .catch((err) => next(err));
    },
  );

  router.get(
    '/me/submissions',
    authenticator.verifyJwtOrCookie.bind(authenticator),
    (req: Request, res: Response, next: NextFunction) => {
      // Cast req as RequestWithJWT because our middleware above asserts that there will be an auth property included
      const applicantID = req.auth?.payload.id || req.session.applicant.id;
      applicantController
        .getMySubmissions(applicantID)
        .then((result) => {
          res.status(200).json(result);
        })
        .catch((err) => next(err));
    },
  );

  router.get(
    '/me',
    authenticator.validateJwt.bind(authenticator),
    (req: Request, res: Response, next: NextFunction) => {
      const reqWithAuth = req as RequestWithJWT;
      const { id } = reqWithAuth.auth.payload;
      applicantController
        .getApplicant(id)
        .then((result) => {
          res.status(200).json(result);
        })
        .catch((err) => next(err));
    },
  );

  router.get(
    '/:id',
    authenticator.validateJwtAdmin.bind(authenticator),
    (req: Request, res: Response, next: NextFunction) => {
      const reqWithAuth = req as RequestWithJWT;
      const { id } = reqWithAuth.params;
      applicantController
        .getApplicant(Number(id))
        .then((result) => {
          res.status(200).json(result);
        })
        .catch((err) => next(err));
    },
  );

  router.delete(
    '/:id',
    authenticator.validateJwtAdmin.bind(authenticator),
    (req: Request, res: Response, next: NextFunction) => {
      const reqWithAuth = req as RequestWithJWT;
      const { id } = reqWithAuth.params;
      applicantController
        .deleteApplicantForce(Number(id))
        .then((result) => {
          res.status(200).json(result);
        })
        .catch((err) => next(err));
    },
  );

  return router;
};

export default applicantRoutes;
