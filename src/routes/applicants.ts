import ApplicantController from '@App/controllers/ApplicantController.js';
import {
  ApplicantQueryParamsSchema,
  ApplicantRequestBodySchema,
} from '@App/resources/schemas/applicants.js';
import {
  ApplicantQueryParams,
  ApplicantRequestBody,
} from '@App/resources/types/applicants.js';
import CappAuth0Client from '@App/services/CappAuth0Client.js';
import express, { Request, Response } from 'express';

const applicantController = new ApplicantController(new CappAuth0Client());
const router = express.Router();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type EmptyObject = Record<string, any>;

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

export default router;
