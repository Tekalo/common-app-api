import ApplicantController from '@App/controllers/ApplicantController.js';
import {
  ApplicantQueryParamsSchema,
  ApplicantRequestBodySchema,
} from '@App/resources/schemas/applicants.js';
import {
  ApplicantQueryParams,
  ApplicantRequestBody,
} from '@App/resources/types/applicants.js';
import AuthService from '@App/services/AuthService.js';
import prisma from '@App/resources/client.js';
import express, { Request, Response } from 'express';

const applicantController = new ApplicantController(new AuthService(), prisma);

const router = express.Router();

export type EmptyObject = Record<string, unknown>;

router.post(
  '/',
  (
    req: Request<EmptyObject, EmptyObject, EmptyObject, ApplicantQueryParams>,
    res: Response,
    next,
  ) => {
    const appBody = req.body as ApplicantRequestBody;
    const validatedBody = ApplicantRequestBodySchema.parse(appBody);
    const validateParams = ApplicantQueryParamsSchema.parse(req.query);
    applicantController
      .createApplicant(validatedBody, validateParams)
      .then((result) => {
        res.status(200).json(result);
      })
      .catch((err) => next(err));
  },
);

router.delete('/:id', (req: Request, res: Response, next) => {
  const id = req.params.id;
  applicantController
    .deleteApplicant(id)
    .then((result) => {
      res.status(200).json(result);
    })
    .catch((err) => next(err));
});

export default router;
