import ApplicantController from '@App/controllers/ApplicantController.js';
import { ApplicantBody } from '@App/resources/types/apiRequestBodies.js';
import { ApplicantQueryParams } from '@App/resources/types/apiRequestParams.js';
import CappAuth0Client from '@App/services/CappAuth0Client.js';
import express, { Request, Response } from 'express';

const applicantController = new ApplicantController(new CappAuth0Client());
const router = express.Router();

export type EmptyObject = Record<string, any>;

router.post(
  '/',
  (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    req: Request<EmptyObject, EmptyObject, EmptyObject, ApplicantQueryParams>,
    res: Response,
    next,
  ) => {
    const appBody = req.body as ApplicantBody;
    applicantController
      .createApplicant(appBody, req.query)
      .then((result) => {
        res.status(200).json(result);
      })
      .catch((err) => next(err));
  },
);

export default router;
