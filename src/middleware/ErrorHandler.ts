import CAPPError from '@App/resources/shared/CAPPError.js';
import { Problem } from '@App/resources/types/apiResponseBodies.js';
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

const errorHandler = (
  err: CAPPError,
  req: Request,
  res: Response,
  next: NextFunction, // eslint-disable-line @typescript-eslint/no-unused-vars
) => {
  const problem: Problem = err.problem || {};
  if (err instanceof ZodError) {
    const { issues } = err;
    problem.title = 'Zod Validation Error';
    problem.status = 400;
    problem.detail = issues[0].code;
  }
  res
    .status(problem.status || 500)
    .setHeader('Content-Type', 'application/problem+json')
    .json(problem);
};

export default errorHandler;
