import { SkillGetResponseBody } from "@App/resources/types/skills.js";
import { PrismaClient, Prisma } from "@prisma/client";
import { Skills } from '@capp/schemas';
import CAPPError from '@App/resources/shared/CAPPError.js';
import AuthService from '@App/services/AuthService.js';

class SkillController {

    private auth0Service: AuthService;

    private prisma: PrismaClient;

    constructor(
        auth0Service: AuthService,
        prisma: PrismaClient,
    ) {
        this.auth0Service = auth0Service;
        this.prisma = prisma;
    }

    async getSkill(): Promise<SkillGetResponseBody> {
        try {
          const name =
            await this.prisma.skill.findMany();
          return Skills.SkillGetResponseBodySchema.parse({
            name,
          });
        } catch (e) {
          if (e instanceof Prisma.PrismaClientKnownRequestError) {
            throw new CAPPError(
              {
                title: 'Skill Retrieval Error',
                detail: 'Could not find any skill',
                status: 404,
              },
              e instanceof Error ? { cause: e } : undefined,
            );
          }
          throw new CAPPError(
            {
              title: 'Skill Retrieval Error',
              detail: 'Error retrieving skill info',
            },
            e instanceof Error ? { cause: e } : undefined,
          );
        }
    }

}

export default SkillController;