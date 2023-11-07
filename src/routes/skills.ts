import express, {
    NextFunction,
    Request,
    RequestHandler,
    Response,
  } from 'express';
import SkillController from "@App/controllers/SkillController.js";
import { Skills } from "@capp/schemas"; 
import { SkillGetResponseBody } from "@App/resources/types/skills.js";
import AuthService from '@App/services/AuthService.js';
import { prisma } from '@App/resources/client.js';
import Authenticator from '@App/middleware/authenticator.js';
import { BaseConfig } from '@App/resources/types/shared.js';
import { RequestWithJWT } from '@App/resources/types/auth0.js';

const skillRoutes = (
    authService: AuthService,
    config: BaseConfig,
  ) => {
    const router = express.Router();
    const skillController = new SkillController(
      authService,
      prisma,
    );

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
              console.log("set code successfully");
            })
            .catch((err) => next(err));
        },
    );

    return router;
  }

export default skillRoutes;