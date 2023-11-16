import {
  ReferenceSkillsCreateRequestBody,
  ReferenceSkillsCreateResponseBody,
  SkillGetResponseBody,
} from '@App/resources/types/skills.js';
import { PrismaClient, RefeneceSkill } from '@prisma/client';
import { Skills } from '@capp/schemas';

class SkillController {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async getSkills(): Promise<SkillGetResponseBody> {
    const skills = await this.prisma.skill.findMany();
    return Skills.SkillGetResponseBodySchema.parse({
      data: skills,
    });
  }

  async createReferenceSkills(
    data: ReferenceSkillsCreateRequestBody,
  ): Promise<ReferenceSkillsCreateResponseBody> {
    const { name } = data;
    const returnReferenceSkill: RefeneceSkill =
      await this.prisma.refeneceSkill.create({
        data: { name },
      });
    return Skills.ReferenceSkillsCreateResponseBodySchema.parse({
      name: returnReferenceSkill.name,
      referenceId: returnReferenceSkill.referenceId,
    });
  }
}

export default SkillController;
