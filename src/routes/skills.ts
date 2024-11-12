import express, {
  NextFunction,
  Request,
  RequestHandler,
  Response,
} from 'express';
import SkillController from '@App/controllers/SkillController.js';
import { prisma } from '@App/resources/client.js';
import { BaseConfig } from '@App/resources/types/shared.js';
import Authenticator from '@App/middleware/authenticator.js';
import { ReferenceSkillsCreateRequestBody } from '@App/resources/types/skills.js';
import { Skills } from '@capp/schemas';


const skillsRoutes = (config: BaseConfig, pathPrefix: string) => {
  const skillController = new SkillController(prisma);

  const mountPublicSkillsRoutes = (app: Application) => {
    app.get(pathPrefix, (req: Request, res: Response, next: NextFunction) => {
      skillController
        .getSkills()
        .then((result) => {
          res
            .status(200)
            .set('Cache-Control', 'public, max-age=3600')
            .json(result);
        })
        .catch((err) => next(err));
    });
  };

  const mountAuthenticatedSkillsRoutes = (app: Application, authenticator: Authenticator) => {
    app.post(
      `${pathPrefix}/referenceSet`,
      authenticator
        .validateJwtRole('admin')
        .bind(authenticator) as RequestHandler,
      (req: Request, res: Response, next) => {
        const referenceSkillsBody = req.body as ReferenceSkillsCreateRequestBody;
        const validatedBody =
          Skills.ReferenceSkillsCreateRequestBodySchema.parse(
            referenceSkillsBody,
          );
        skillController
          .createReferenceSkills(validatedBody)
          .then((result) => {
            res.status(200).json(result);
          })
          .catch((err) => next(err));
      },
    );
  }

  return { mountPublicSkillsRoutes, mountAuthenticatedSkillsRoutes };
};

export default skillsRoutes;
