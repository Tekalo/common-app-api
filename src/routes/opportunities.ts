import OpportunityController from '@App/controllers/OpportunityController.js';
import prisma from '@App/resources/client.js';
import { OpportunityBatchRequestBodySchema } from '@App/resources/schemas/opportunities.js';
import { OpportunityBatchRequestBody } from '@App/resources/types/opportunities.js';
import express, { Request, Response } from 'express';

const opportunityController = new OpportunityController(prisma);

const router = express.Router();

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

export default router;
