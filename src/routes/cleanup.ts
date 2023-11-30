import express, {
  NextFunction,
  Request,
  RequestHandler,
  Response,
} from 'express';
import ApplicantController from '@App/controllers/ApplicantController.js';
import OpportunityController from '@App/controllers/OpportunityController.js';

import AuthService from '@App/services/AuthService.js';
import { prisma } from '@App/resources/client.js';
import Authenticator from '@App/middleware/authenticator.js';
import EmailService from '@App/services/EmailService.js';
import UploadService from '@App/services/UploadService.js';
import { BaseConfig } from '@App/resources/types/shared.js';

const cleanupRoutes = (
  authService: AuthService,
  emailService: EmailService,
  uploadService: UploadService,
  config: BaseConfig,
) => {
  const router = express.Router();
  const applicantController = new ApplicantController(
    authService,
    prisma,
    emailService,
    uploadService,
  );
  const opportunityController = new OpportunityController(prisma, emailService);

  const appConfig = config;
  appConfig.auth0.express.cacheMaxAge = 12 * 60 * 60 * 1000; // 12 hours
  const authenticator = new Authenticator(prisma, appConfig);

  router.delete(
    '/testusers',
    authenticator
      .validateJwtRole('admin')
      .bind(authenticator) as RequestHandler,
    (req: Request, res: Response, next: NextFunction) => {
      applicantController
        .deleteTestApplicants()
        .then((result) => {
          res.status(200).json(result);
        })
        .catch((err) => next(err));
    },
  );

  router.delete(
    '/testopportunities',
    authenticator
      .validateJwtRole('admin')
      .bind(authenticator) as RequestHandler,
    (re: Request, res: Response, next: NextFunction) => {
      opportunityController
        .deleteTestOpportunities()
        .then((result) => {
          res.status(200).json(result);
        })
        .catch((err) => next(err));
    },
  );
  return router;
};

export default cleanupRoutes;
