import MeController from '@App/controllers/MeController.js';
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
import express, { Request, Response } from 'express';

export type EmptyObject = Record<string, unknown>;

const meRoutes = () => {
  const router = express.Router();
  const applicantController = new MeController(prisma);
  // router.post('/', (req: Request, res: Response, next) => {
  //   const appBody = req.body as ApplicantRequestBody;
  //   const validatedBody = ApplicantRequestBodySchema.parse(appBody);
  //   applicantController
  //     .createApplicant(validatedBody)
  //     .then((result) => {
  //       res.status(200).json(result);
  //     })
  //     .catch((err) => next(err));
  // });

  router.get('/submissions', (req: Request, res: Response, next) => {
    const appBody = req.body as ApplicantSubmissionBody;
    const applicantID = +req.params.id;
    const validatedBody = ApplicantSubmissionRequestBodySchema.parse(appBody);
    applicantController
      .getSubmissions(applicantID)
      .then((result) => {
        res.status(200).json(result);
      })
      .catch((err) => next(err));
  });
};

export default meRoutes;
