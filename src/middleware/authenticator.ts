import configLoader from '@App/services/configLoader.js';
import { Request, Response, NextFunction } from 'express';
import { auth } from 'express-oauth2-jwt-bearer';
import { verifyCookie } from '@App/services/cookieService.js';

/**
 * middleware to check valid JWT or session cookie
 */
const authConfig = configLoader.loadConfig().auth0.express;

const validateJwt = (req: Request, res: Response, next: NextFunction) => {
  auth(authConfig)(req, res, next);
};

const validateCookie = (req: Request, res: Response, next: NextFunction) => {
  verifyCookie(req, res, next);
};

const verifyJwtOrCookie = (req: Request, res: Response, next: NextFunction) => {
  auth(authConfig)(req, res, () => {
    if (!req.auth) {
      verifyCookie(req, res, next);
    } else {
      next();
    }
  });
};

export { validateJwt, validateCookie, verifyJwtOrCookie };
