import { Problem } from '@App/resources/types/shared.js';

/**
 * Generic class for any CAPP Errors
 */
export default class CAPPError extends Error {
  public problem;

  constructor(problem: Problem, options?: ErrorOptions) {
    super(problem.title, options);
    this.problem = problem;
  }

  get status() {
    return this.problem.status;
  }
}
