import { Request, Response, NextFunction, Handler } from 'express';
import { auth, AuthOptions } from 'express-oauth2-jwt-bearer';
import { verifyCookie } from '@App/services/cookieService.js';
import { PrismaClient } from '@prisma/client';
import {
  Auth0ExpressConfig,
  Claims,
  RequestWithJWT,
} from '@App/resources/types/auth0.js';
import CAPPError from '@App/resources/shared/CAPPError.js';

const adminRole = 'admin';

class Authenticator {
  private prisma: PrismaClient;

  private authConfig: Auth0ExpressConfig;

  private authHandler?: Handler; // TODO not make optional ?

  constructor(prisma: PrismaClient, authConfig: Auth0ExpressConfig) {
    this.prisma = prisma;
    this.authConfig = authConfig;
  }

  getAuthHandler(overrides?: Partial<AuthOptions>): Handler {
    if (!this.authHandler) {
      const config = { ...this.authConfig, ...overrides };
      this.authHandler = auth(config);
    }
    // TODO dont re-use if we have overrides like "authRequred"
    return this.authHandler;
  }

  // An alternative to validateJwt().
  // Use on routes that need a JWT, but the user may not exist yet in the database
  async validateJwtOfUnregisteredUser(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    await this.validateJwt(req, res, (err) => {
      if (err) {
        // If our user doesn't exist in the DB aka has not registered yet. But thats OK.
        if (err instanceof CAPPError && err.problem.status === 404) {
          next();
          return;
        }
        next(err);
      } else {
        next();
      }
    });
  }

  // Use on routes that can only authenticate with a JWT and where applicant must exist in the database
  // eslint-disable-next-line @typescript-eslint/require-await
  async validateJwt(req: Request, res: Response, next: NextFunction) {
    try {
      const authHandler = this.getAuthHandler();
      // eslint-disable-next-line @typescript-eslint/await-thenable
      await authHandler(req, res, (async (err) => {
        if (!req.auth) {
          next(
            new CAPPError(
              {
                title: 'Cannot authenticate request',
                detail: 'Applicant cannot be authenticated',
                status: 401,
              },
              err instanceof Error ? { cause: err } : undefined,
            ),
          );
          return;
        }
        await this.setApplicantID(req as RequestWithJWT, res, next);
      }) as NextFunction);
    } catch (err) {
      next(err);
    }
  }

  // Attach to requests that can only authenticate with a JWT and are verified as test/admin accounts
  async validateJwtAdmin(req: Request, res: Response, next: NextFunction) {
    const authHandler = this.getAuthHandler();
    // eslint-disable-next-line @typescript-eslint/await-thenable
    await authHandler(req, res, (err) => {
      if (
        !req.auth ||
        !req.auth.payload['auth0.capp.com/roles'] ||
        !req.auth.payload['auth0.capp.com/roles'].includes(adminRole)
      ) {
        next(
          new CAPPError(
            {
              title: 'Cannot authenticate request',
              detail: 'Applicant cannot be authenticated',
              status: 401,
            },
            err instanceof Error ? { cause: err } : undefined,
          ),
        );
        return;
      }
      next();
    });
  }

  // Attach auth to request if it exists. If not, do not throw.
  async attachJwt(req: Request, res: Response, next: NextFunction) {
    const authHandler = this.getAuthHandler({ authRequired: false } );
    // eslint-disable-next-line @typescript-eslint/await-thenable
    await authHandler(req, res, next);
  }

  // Attach to requests that can only authenticate with a cookie
  static validateCookie(req: Request, res: Response, next: NextFunction) {
    verifyCookie(req, res, next);
  }

  // Attach to requests that can authenticate with either JWT or cookie
  async verifyJwtOrCookie(req: Request, res: Response, next: NextFunction) {
    // eslint-disable-next-line @typescript-eslint/await-thenable
    const authHandler = this.getAuthHandler();
    // eslint-disable-next-line @typescript-eslint/await-thenable
    await authHandler(req, res, (async () => {
      if (!req.auth) {
        verifyCookie(req, res, next);
      } else {
        await this.setApplicantID(req as RequestWithJWT, res, next);
      }
    }) as NextFunction);
  }

  // Fetch and set the applicant ID from postgres in our auth token payload.
  private async setApplicantID(
    req: RequestWithJWT,
    res: Response,
    next: NextFunction,
  ) {
    const email = req.auth.payload[Claims.email] as string;
    try {
      const { id } = await this.prisma.applicant.findFirstOrThrow({
        where: { email },
      });
      req.auth.payload.id = id;
      next();
    } catch (e) {
      // Could not find applicant in Postgres
      next(
        new CAPPError(
          {
            title: 'Not Found',
            detail: 'Applicant cannot be found',
            status: 404,
          },
          e instanceof Error ? { cause: e } : undefined,
        ),
      );
    }
  }
}

export default Authenticator;
