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

import AuthService from '@App/services/AuthService.js';
import prisma from '@App/resources/client.js';
import express, { NextFunction, Request, Response } from 'express';
import { auth } from 'express-oauth2-jwt-bearer';
import configLoader from '@App/services/configLoader.js';
import { requestHandler } from '@sentry/node/types/handlers.js';

const applicantRoutes = (authService: AuthService) => {
  const router = express.Router();
  const applicantController = new ApplicantController(authService, prisma);
  router.post('/', (req: Request, res: Response, next) => {
    const appBody = req.body as ApplicantRequestBody;
    const validatedBody = ApplicantRequestBodySchema.parse(appBody);
    applicantController
      .createApplicant(validatedBody)
      .then((result) => {
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
    const appBody = req.body as ApplicantDraftSubmissionBody;
    const applicantID = +req.params.id;
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
    (req: Request, res: Response, next: NextFunction) => {
      // auth({ audience: 'https://auth0.capp.com' , issuerBaseURL: 'https://sf-capp-dev.us.auth0.com' });
      // console.log(theauth);
      const theauth = authService.getAuthMiddleware();
      console.log('here!!');
      const authToken = req.get('Authorization') || '';
      console.log(theauth);
      // todo: is this realiable?
      const { email } = JSON.parse(
        Buffer.from(authToken.split('.')[1], 'base64').toString(),
      );
      console.log(email);
      applicantController
        .getMySubmissions(email)
        .then((result) => {
          res.status(200).json(result);
        })
        .catch((err) => next(err));
    },
  );

  return router;
};

export default applicantRoutes;
