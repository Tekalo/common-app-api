import { SkillGetResponseBody } from '@App/resources/types/skills.js';
import { PrismaClient, Prisma } from '@prisma/client';
import { Skills } from '@capp/schemas';
import CAPPError from '@App/resources/shared/CAPPError.js';

class SkillController {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async getSkill(): Promise<SkillGetResponseBody> {
    try {
      const skills = await this.prisma.skill.findMany();
      return Skills.SkillGetResponseBodySchema.parse({
        data: skills,
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
