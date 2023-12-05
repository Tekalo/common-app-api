import {
  ReferenceSkillsCreateRequestBody,
  ReferenceSkillsCreateResponseBody,
  SkillGetResponseBody,
} from '@App/resources/types/skills.js';
import { PrismaClient } from '@prisma/client';
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
    requestedSkills: ReferenceSkillsCreateRequestBody,
  ): Promise<ReferenceSkillsCreateResponseBody> {
    const referenceSkillUpserts = requestedSkills.map((skill) =>
      this.prisma.referenceSkills.upsert({
        create: {
          referenceId: skill.referenceId,
          name: skill.name,
        },
        update: {
          name: skill.name,
        },
        where: {
          referenceId: skill.referenceId,
        },
      }),
    );

    // Use Promise.all to wait for all upsert operations to complete
    const result = await Promise.all(referenceSkillUpserts);

    return Skills.ReferenceSkillsCreateResponseBodySchema.parse({
      successCount: result.length,
    });
  }
}

export default SkillController;
