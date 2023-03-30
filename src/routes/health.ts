import express, { Request, Response } from 'express';

const healthRoutes = () => {
  const router = express.Router();
  router.get('/', (req: Request, res: Response) => {
    res.status(200).send({ healthy: true });
  });
  return router;
};

export default healthRoutes;
