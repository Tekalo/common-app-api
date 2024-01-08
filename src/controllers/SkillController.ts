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
    // groupBy to de-duplicate the same canonical skill name regardless of casing
    const skills = await this.prisma.skillsView.groupBy({
      by: ['canonical', 'priority'],
      where: {
        suggest: true,
        rejectAs: null,
      },
    });
    return Skills.SkillGetResponseBodySchema.parse({
      data: skills,
    });
  }

  async createReferenceSkills(
    requestedSkills: ReferenceSkillsCreateRequestBody,
  ): Promise<ReferenceSkillsCreateResponseBody> {
    // Use Promise.all to wait for all upsert operations to complete
    const results = await Promise.all(
      requestedSkills.map(async (skill) => {
        await this.prisma.referenceSkills.upsert({
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
        });
      }),
    );

    return Skills.ReferenceSkillsCreateResponseBodySchema.parse({
      successCount: results.length,
    });
  }
}

export default SkillController;
