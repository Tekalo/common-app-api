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
  ApplicantUpdateBody,
} from '@App/resources/types/applicants.js';
import { UploadRequestBodySchema } from '@App/resources/schemas/uploads.js';
import { UploadRequestBody } from '@App/resources/types/uploads.js';
import { setCookie } from '@App/services/cookieService.js';

import AuthService from '@App/services/AuthService.js';
import prisma from '@App/resources/client.js';
import express, {
  NextFunction,
  Request,
  RequestHandler,
  Response,
} from 'express';
import Authenticator from '@App/middleware/authenticator.js';
import { RequestWithJWT } from '@App/resources/types/auth0.js';
import EmailService from '@App/services/EmailService.js';
import MonitoringService from '@App/services/MonitoringService.js';
import UploadService from '@App/services/UploadService.js';
import { BaseConfig } from '@App/resources/types/shared.js';

const applicantRoutes = (
  authService: AuthService,
  emailService: EmailService,
  monitoringService: MonitoringService,
  uploadService: UploadService,
  config: BaseConfig,
) => {
  const router = express.Router();

  const applicantController = new ApplicantController(
    authService,
    prisma,
    emailService,
    monitoringService,
    uploadService,
  );

  const appConfig = config;
  appConfig.auth0.express.cacheMaxAge = 12 * 60 * 60 * 1000; // 12 hours
  const authenticator = new Authenticator(prisma, appConfig);

  router.post('/', (req: Request, res: Response, next) => {
    const appBody = req.body as ApplicantRequestBody;
    const validatedBody = ApplicantRequestBodySchema.parse(appBody);
    applicantController
      .createApplicant(validatedBody, req.auth)
      .then((result) => {
        req.session.applicant = setCookie(result);
        res.status(200).json(result);
      })
      .catch((err) => next(err));
  });

  router.post(
    '/me/submissions',
    authenticator.verifyJwtOrCookie.bind(authenticator) as RequestHandler,
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
    authenticator.validateJwt.bind(authenticator) as RequestHandler,
    (req: Request, res: Response, next) => {
      const appBody = req.body as ApplicantStateBody;
      const reqWithAuth = req as RequestWithJWT;
      const applicantID = reqWithAuth.auth.payload.id;
      const { pause } = ApplicantStateRequestBodySchema.parse(appBody);
      applicantController
        // applicantID type assertion because our middlware setApplicantId() guarantees an applicant ID is set
        .pauseApplicant(applicantID as number, pause)
        .then((result) => {
          res.status(200).json(result);
        })
        .catch((err) => next(err));
    },
  );

  router.put(
    '/:auth0Id',
    authenticator.requiresScope(
      'update:tekalo_db_user_auth0_id',
    ) as RequestHandler,
    (req: Request, res: Response, next) => {
      const appBody = req.body as ApplicantUpdateBody;
      const reqWithAuth = req as RequestWithJWT;
      const { auth0Id } = reqWithAuth.params;
      applicantController
        .updateApplicantAuth0Id(auth0Id, appBody)
        .then((result) => {
          res.status(200).json(result);
        })
        .catch((err) => next(err));
    },
  );

  router.delete(
    '/me',
    authenticator.validateJwtOfUnregisteredUser.bind(
      authenticator,
    ) as RequestHandler,
    (req: Request, res: Response, next) => {
      const reqWithAuth = req as RequestWithJWT;
      const { id } = reqWithAuth.auth.payload; // Applicant exists in the database
      if (id) {
        // Delete from DB too
        applicantController
          .deleteApplicant(id)
          .then((result) => {
            res.status(200).json(result);
          })
          .catch((err) => next(err));
      } else {
        // Applicant does not exist in the database but still has a JWT
        const auth0Id = reqWithAuth.auth.payload.sub as string;
        applicantController
          .deleteAuth0OnlyApplicant(auth0Id)
          .then((result) => {
            res.status(200).json(result);
          })
          .catch((err) => next(err));
      }
    },
  );

  router.post(
    '/me/submissions/draft',
    authenticator.verifyJwtOrCookie.bind(authenticator) as RequestHandler,
    (req: Request, res: Response, next) => {
      const appBody = req.body as ApplicantDraftSubmissionBody;
      const applicantID = req.auth?.payload.id || req.session.applicant.id; // token applicant ID
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
    authenticator.verifyJwtOrCookie.bind(authenticator) as RequestHandler,
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
    authenticator.validateJwt.bind(authenticator) as RequestHandler,
    (req: Request, res: Response, next: NextFunction) => {
      const reqWithAuth = req as RequestWithJWT;
      const { id } = reqWithAuth.auth.payload;
      applicantController
        // id type assertion because our middlware setApplicantId() guarantees an applicant ID is set
        .getApplicant(id as number)
        .then((result) => {
          res.status(200).json(result);
        })
        .catch((err) => next(err));
    },
  );

  // DEV ONLY resume upload
  if (config.env === 'dev') {
    router.post(
      '/me/uploads/resume',
      authenticator.verifyJwtOrCookie.bind(authenticator) as RequestHandler,
      (req: Request, res: Response, next) => {
        const appBody = req.body as UploadRequestBody;
        const applicantID = req.auth?.payload.id || req.session.applicant.id;
        const validatedBody = UploadRequestBodySchema.parse(appBody);
        applicantController
          .getResumeUploadUrl(applicantID, validatedBody)
          .then((result) => {
            res.status(200).json(result);
          })
          .catch((err) => next(err));
      },
    );
  }

  /**
   * ADMIN ENDPOINTS BELOW
   * ONLY for use by E2E frontend tests OR by developers
   * Do not call from applicant code
   * */
  router.get(
    '/:id',
    authenticator.validateJwtAdmin.bind(authenticator) as RequestHandler,
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
    authenticator.validateJwtAdmin.bind(authenticator) as RequestHandler,
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
// adding comment to test pushing to draft pr.
