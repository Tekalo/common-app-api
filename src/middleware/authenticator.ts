import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyCookie } from '@App/services/cookieService.js';
import {
  Claims,
  RequestWithJWT,
  AuthRequest,
} from '@App/resources/types/auth0.js';
import CAPPError from '@App/resources/shared/CAPPError.js';
import { BaseConfig } from '@App/resources/types/shared.js';

class Authenticator {
  private prisma: PrismaClient;

  private config: BaseConfig;

  constructor(prisma: PrismaClient, config: BaseConfig) {
    this.prisma = prisma;
    this.config = config;
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
  async validateJwt(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        next(
          req.authError ||
            new CAPPError({
              title: 'Cannot authenticate request',
              detail: 'Applicant cannot be authenticated',
              status: 401,
            }),
        );
        return;
      }
      await this.setApplicantID(req as RequestWithJWT);
      next();
    } catch (e) {
      next(e);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  validateJwtRole(role: string) {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
      if (
        !req.auth ||
        !req.auth.payload['auth0.capp.com/roles'] ||
        !req.auth.payload['auth0.capp.com/roles'].includes(role)
      ) {
        next(
          req.authError ||
            new CAPPError({
              title: 'Cannot authenticate request',
              detail: 'Applicant cannot be authenticated',
              status: 401,
            }),
        );
        return;
      }
      next();
    };
  }

  // Used for applications to authenticate with the API.
  // eslint-disable-next-line class-methods-use-this
  requiresScope(scope: string) {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        if (
          !req.auth ||
          !req.auth.payload.scope ||
          !req.auth?.payload.scope.split(' ').includes(scope)
        ) {
          next(
            req.authError ||
              new CAPPError({
                title: 'Cannot authenticate request',
                detail: 'Application cannot be authenticated',
                status: 401,
              }),
          );
          return;
        }
        next();
      } catch (e) {
        next(e);
      }
    };
  }

  // Attach to requests that can only authenticate with a cookie
  static validateCookie(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      verifyCookie(req);
      next();
    } catch (e) {
      next(e);
    }
  }

  // Attach to requests that can authenticate with either JWT or cookie
  async verifyJwtOrCookie(req: AuthRequest, res: Response, next: NextFunction) {
    if (!req.auth) {
      try {
        verifyCookie(req);
      } catch (e) {
        next(e);
        return;
      }
    } else {
      try {
        await this.setApplicantID(req as RequestWithJWT);
      } catch (e) {
        next(e);
        return;
      }
    }
    next();
  }

  // Fetch and set the applicant ID from postgres in our auth token payload.
  private async setApplicantID(req: RequestWithJWT) {
    const email = req.auth.payload[Claims.email] as string;
    try {
      const { id } = await this.prisma.applicant.findFirstOrThrow({
        where: { email },
      });
      req.auth.payload.id = id;
    } catch (e) {
      // Could not find applicant in Postgres
      throw new CAPPError(
        {
          title: 'Not Found',
          detail: 'Applicant cannot be found',
          status: 404,
        },
        e instanceof Error ? { cause: e } : undefined,
      );
    }
  }
}

export default Authenticator;
