import express, { NextFunction, Request, Response, Application } from 'express';
import CauseController from '@App/controllers/CauseController.js';
import { prisma } from '@App/resources/client.js';
import { BaseConfig } from '@App/resources/types/shared.js';

const causesRoutes = (config: BaseConfig, pathPrefix: string) => {
  const causeController = new CauseController(prisma);

  return {
    mountPublicCausesRoutes: (app: Application) => {
      app.get(pathPrefix, (req: Request, res: Response, next: NextFunction) => {
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
    }
  }
};

export default causesRoutes;
