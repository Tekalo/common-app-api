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
    data: ReferenceSkillsCreateRequestBody,
  ): Promise<ReferenceSkillsCreateResponseBody> {
    let successCount = 0;

    // Use Promise.all to wait for all upsert operations to complete
    await Promise.all(
      data.map(async (element) => {
        await this.prisma.referenceSkills.upsert({
          create: {
            referenceId: element.referenceId,
            name: element.name,
          },
          update: {
            referenceId: element.referenceId,
            name: element.name,
          },
          where: {
            referenceId: element.referenceId,
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
