import { Request, Response, NextFunction } from 'express';
import { verifyCookie } from '@App/services/cookieService.js';
import { PrismaClient } from '@prisma/client';
import {
  Auth0ExpressConfig,
  Claims,
  RequestWithJWT,
  RequestWithoutJWT,
} from '@App/resources/types/auth0.js';
import CAPPError from '@App/resources/shared/CAPPError.js';

const adminRole = 'admin';

class Authenticator {
  private prisma: PrismaClient;

  private authConfig: Auth0ExpressConfig;

  constructor(prisma: PrismaClient, authConfig: Auth0ExpressConfig) {
    this.prisma = prisma;
    this.authConfig = authConfig;
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
          return; // do i need dis
        }
        next(err);
      } else {
        next();
      }
    });
  }

  // if (req.authError) {
  //   throw req.authError;
  // } else {
  //   throw something else -- i guess a 401 but maybe a 500 -- why are we here?
  // }

  // Use on routes that can only authenticate with a JWT and where applicant must exist in the database
  // eslint-disable-next-line @typescript-eslint/require-await
  async validateJwt(req: RequestWithoutJWT, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        if (req.authError) {
          next(req.authError); // TODO Add test for some random 500 error comin thruuu!
        }
        next(
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

  // Attach to requests that can only authenticate with a JWT and are verified as test/admin accounts
  // eslint-disable-next-line class-methods-use-this
  validateJwtAdmin(req: RequestWithoutJWT, res: Response, next: NextFunction) {
    if (
      !req.auth ||
      !req.auth.payload['auth0.capp.com/roles'] ||
      !req.auth.payload['auth0.capp.com/roles'].includes(adminRole)
    ) {
      if (req.authError) {
        next(req.authError); // TODO Add test for some random 500 error comin thruuu!
      } else {
        next(
          new CAPPError({
            title: 'Cannot authenticate request',
            detail: 'Applicant cannot be authenticated',
            status: 401,
          }),
        );
        return;
      }
    }
    next();
  }

  // Attach to requests that can only authenticate with a cookie
  static validateCookie(
    req: RequestWithoutJWT,
    res: Response,
    next: NextFunction,
  ) {
    try {
      verifyCookie(req);
      next();
    } catch (e) {
      next(e);
    }
  }

  // Attach to requests that can authenticate with either JWT or cookie
  async verifyJwtOrCookie(
    req: RequestWithoutJWT,
    res: Response,
    next: NextFunction,
  ) {
    if (!req.auth) {
      if (req.authError) {
        next(req.authError); // TODO Add test for some random 500 error comin thruuu!
      } else {
        try {
          verifyCookie(req);
        } catch (e) {
          next(e);
        }
      }
    } else {
      try {
        await this.setApplicantID(req as RequestWithJWT);
      } catch (e) {
        next(e);
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
