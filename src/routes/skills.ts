import express, {
  NextFunction,
  Request,
  RequestHandler,
  Response,
} from 'express';
import SkillController from '@App/controllers/SkillController.js';
import { prisma } from '@App/resources/client.js';
import Authenticator from '@App/middleware/authenticator.js';
import { BaseConfig } from '@App/resources/types/shared.js';

const skillRoutes = (config: BaseConfig) => {
  const router = express.Router();
  const skillController = new SkillController(prisma);

  const appConfig = config;
  appConfig.auth0.express.cacheMaxAge = 12 * 60 * 60 * 1000; // 12 hours
  const authenticator = new Authenticator(prisma, appConfig);

  router.get(
    '/',
    authenticator
      .validateJwtRole('admin')
      .bind(authenticator) as RequestHandler,
    (req: Request, res: Response, next: NextFunction) => {
      skillController
        .getSkill()
        .then((result) => {
          res.status(200).json(result);
        })
        .catch((err) => next(err));
    },
  );

  return router;
};

export default skillRoutes;
