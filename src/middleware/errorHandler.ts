import CAPPError from '@App/resources/shared/CAPPError.js';
import { Problem } from '@App/resources/types/shared.js';
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

const errorHandler = (
  err: CAPPError,
  req: Request,
  res: Response,
  next: NextFunction, // eslint-disable-line @typescript-eslint/no-unused-vars
) => {
  const problem: Problem = err.problem || {};
  if (err.message === 'Unauthorized') {
    problem.title = 'Unauthorized';
    problem.status = 401;
  }
  if (err instanceof ZodError) {
    const { issues } = err;
    problem.title = 'Validation Error';
    problem.status = 400;
    problem.detail = issues[0].code;
  }
  res
    .status(problem.status || 500)
    .setHeader('Content-Type', 'application/problem+json')
    .json(problem);
};

export default errorHandler;
