import express, { NextFunction, Request, Response } from 'express';
import SkillController from '@App/controllers/SkillController.js';
import { prisma } from '@App/resources/client.js';
import { BaseConfig } from '@App/resources/types/shared.js';

const skillsRoutes = (config: BaseConfig) => {
  const router = express.Router();
  const skillController = new SkillController(prisma);

  const appConfig = config;
  appConfig.auth0.express.cacheMaxAge = 12 * 60 * 60 * 1000; // 12 hours in ms

  router.get('/', (req: Request, res: Response, next: NextFunction) => {
    skillController
      .getSkills()
      .then((result) => {
        res
          .status(200)
          .set('Cache-Control', 'public, max-age=3600')
          .json(result);
      })
      .catch((err) => next(err));
  });

  return router;
};

export default skillsRoutes;
