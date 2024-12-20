import express, { NextFunction, Request, Response } from 'express';
import CauseController from '@App/controllers/CauseController.js';
import { prisma } from '@App/resources/client.js';
import { BaseConfig } from '@App/resources/types/shared.js';

const causesRoutes = (config: BaseConfig) => {
  const router = express.Router();
  const causeController = new CauseController(prisma);

  const appConfig = config;
  appConfig.auth0.express.cacheMaxAge = 12 * 60 * 60 * 1000; // 12 hours in ms

  router.get('/', (req: Request, res: Response, next: NextFunction) => {
    causeController
      .getCauses()
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

export default causesRoutes;
