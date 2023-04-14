import configLoader from '@App/services/configLoader.js';
import { Request, Response, NextFunction } from 'express';
import { auth } from 'express-oauth2-jwt-bearer';

const verifyJwt = (req: Request, res: Response, next: NextFunction) => {
  auth(configLoader.loadConfig().auth0.express)(req, res, next);
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const verifyCookie = (req: Request, res: Response, next: NextFunction) => {
  // eslint-disable-next-line no-console
  console.log('TODO: check le cookie');
};

export { verifyJwt, verifyCookie };
