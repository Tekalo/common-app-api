import express, {
  NextFunction,
  Request,
  RequestHandler,
  Response,
} from 'express';
import ApplicantController from '@App/controllers/ApplicantController.js';

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
          // Resolve the inner promises
          Promise.all(result)
            .then((values) => {
              res.status(200).json(values);
            })
            .catch((err) => next(err));
        })
        .catch((err) => next(err));
    },
  );
  return router;
};

export default cleanupRoutes;
