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
    const skills = await this.prisma.skillsView.findMany({
      where: {
        suggest: true,
        rejectAs: null,
      },
      select: {
        canonical: true,
      },
    });

    return Skills.SkillGetResponseBodySchema.parse({
      data: skills,
    });
  }

  async createReferenceSkills(
    requestedSkills: ReferenceSkillsCreateRequestBody,
  ): Promise<ReferenceSkillsCreateResponseBody> {
    let successCount = 0;

    // Use Promise.all to wait for all upsert operations to complete
    await Promise.all(
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

        successCount += 1;
      }),
    );

    return Skills.ReferenceSkillsCreateResponseBodySchema.parse({
      successCount,
    });
  }
}

export default SkillController;
