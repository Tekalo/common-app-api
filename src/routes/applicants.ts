import ApplicantController from '@App/controllers/ApplicantController.js';
import express, { Request, Response } from 'express';

const applicantController = new ApplicantController();
const router = express.Router();

router.post('/', (req: Request, res: Response) => {
  const response = applicantController.createApplicant();
  res.status(200).send(response);
});

export default router;
