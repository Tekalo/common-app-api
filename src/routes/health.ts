import express, { Request, Response } from 'express';

const router = express.Router();

const healthRoutes = () => {
  router.get('/', (req: Request, res: Response) => {
    res.status(200).send({ healthy: true });
  });
  return router;
};

export default healthRoutes;
