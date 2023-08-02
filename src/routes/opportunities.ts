import express, { Request, RequestHandler, Response } from 'express';
import OpportunityController from '@App/controllers/OpportunityController.js';
import prisma from '@App/resources/client.js';
import { OpportunityBatchRequestBodySchema } from '@App/resources/schemas/opportunities.js';
import { OpportunityBatchRequestBody } from '@App/resources/types/opportunities.js';
import EmailService from '@App/services/EmailService.js';
import Authenticator from '@App/middleware/authenticator.js';
import { RequestWithJWT } from '@App/resources/types/auth0.js';
import { BaseConfig } from '@App/resources/types/shared.js';

const opportunitiesRoutes = (
  emailService: EmailService,
  config: BaseConfig,
) => {
  const opportunityController = new OpportunityController(prisma, emailService);
  const router = express.Router();
  const appConfig = config;
  appConfig.auth0.express.cacheMaxAge = 12 * 60 * 60 * 1000; // 12 hours
  const authenticator = new Authenticator(prisma, appConfig);

  router.post('/batch', (req: Request, res: Response, next) => {
    const appBody = req.body as OpportunityBatchRequestBody;
    const validatedBody = OpportunityBatchRequestBodySchema.parse(appBody);
    opportunityController
      .createOpportunityBatch(validatedBody)
      .then((result) => {
        res.status(200).json(result);
      })
      .catch((err) => next(err));
  });

  // Admin endpoints
  router.delete(
    '/batch/:id',
    authenticator.validateJwtAdmin.bind(authenticator) as RequestHandler,
    (req: Request, res: Response, next) => {
      const reqWithAuth = req as RequestWithJWT;
      const { id } = reqWithAuth.params;
      opportunityController
        .deleteOpportunityForce(Number(id))
        .then((result) => {
          res.status(200).json(result);
        })
        .catch((err) => next(err));
    },
  );

  return router;
};

export default opportunitiesRoutes;
