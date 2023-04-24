import express, { Request, Response } from 'express';

const healthRoutes = () => {
  const router = express.Router();
  router.get('/', (req: Request, res: Response, next) => {
    const healthcheck = {
      healthy: true,
    };
    try {
      res.status(200).send(healthcheck);
    } catch (error) {
      res.status(503).send();
    }
  });
  return router;
};

export default healthRoutes;
