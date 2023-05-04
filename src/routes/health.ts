import express, { Request, Response } from 'express';
import HealthService, { ResourceHealth } from '@App/services/HealthService.js';
import prisma from '@App/resources/client.js';

const healthRoutes = () => {
  const router = express.Router();
  router.get('/', (req: Request, res: Response, next) => {
    const healthService = new HealthService(prisma);
    healthService
      .getHealth()
      .then((result) => {
        res.status(result.status === ResourceHealth.Healthy ? 200 : 503).send({
          healthy: result.status === ResourceHealth.Healthy,
        });
      })
      .catch((err) => next(err));
  });
  return router;
};

export default healthRoutes;
