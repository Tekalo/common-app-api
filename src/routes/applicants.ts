import ApplicantController from '@App/controllers/ApplicantController.js';
import {
  ApplicantRequestBodySchema,
  ApplicantSubmissionRequestBodySchema,
} from '@App/resources/schemas/applicants.js';
import {
  ApplicantRequestBody,
  ApplicantSubmissionBody,
} from '@App/resources/types/applicants.js';

import AuthService from '@App/services/AuthService.js';
import prisma from '@App/resources/client.js';
import express, { Request, Response } from 'express';

export type EmptyObject = Record<string, unknown>;

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

  return router;
};

export default applicantRoutes;
