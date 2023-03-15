import OpportunityController from '@App/controllers/OpportunityController.js';
import prisma from '@App/resources/client.js';
import { OpportunityRequestBodySchema } from '@App/resources/schemas/opportunities.js';
import { OpportunityRequestBody } from '@App/resources/types/opportunities.js';
import express, { Request, Response } from 'express';

const opportunityController = new OpportunityController(prisma);

const router = express.Router();

router.post('/submissions', (req: Request, res: Response, next) => {
  const appBody = req.body as OpportunityRequestBody;
  const validatedBody = OpportunityRequestBodySchema.parse(appBody);
  opportunityController
    .createOpportunitySubmissions(validatedBody)
    .then((result) => {
      res.status(200).json(result);
    })
    .catch((err) => next(err));
});

export default router;
