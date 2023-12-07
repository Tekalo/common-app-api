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
    const skills = await this.prisma.skillsView.groupBy({
      by: ['canonicalLowerCase'],
      where: {
        suggest: true,
        rejectAs: null,
      },
      _min: {
        canonical: true,
      },
    });

    const onlyCanonical = skills.map((skill) => ({
      // eslint-disable-next-line no-underscore-dangle
      canonical: skill._min.canonical,
    }));

    return Skills.SkillGetResponseBodySchema.parse({
      data: onlyCanonical,
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
