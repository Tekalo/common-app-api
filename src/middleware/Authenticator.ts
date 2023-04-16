import configLoader from '@App/services/configLoader.js';
import { Request, Response, NextFunction } from 'express';
import { auth } from 'express-oauth2-jwt-bearer';
import { validateCookie } from '@App/services/cookieService.js';

/**
 * middleware to check either valid JWT or session cookie
 */
const authConfig = configLoader.loadConfig().auth0.express;

const validateJwt = (req: Request, res: Response, next: NextFunction) => {
  auth(authConfig)(req, res, next);
};

const verifyCookie = (req: Request, res: Response, next: NextFunction) => {
  validateCookie(req, res, next);
};

const verifyJwtOrCookie = (req: Request, res: Response, next: NextFunction) => {
  auth(authConfig)(req, res, () => {
    if (!req.auth) {
      validateCookie(req, res, next);
    } else {
      next();
    }
    // if JWT was valid, continue
  });
};

export { validateJwt, verifyCookie, verifyJwtOrCookie };
