import CAPPError from '@App/resources/shared/CAPPError.js';
import { Prisma, PrismaClient } from '@prisma/client';
import {
  OpportunityRequestBody,
  OpportunityResponseBody,
} from '@App/resources/types/opportunities.js';

class OpportunityController {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async createOpportunitySubmissions(
    data: OpportunityRequestBody,
  ): Promise<OpportunityResponseBody> {
    try {
      const prismaPayload = data.map(({ organization, contact }) => ({
        orgName: organization.name,
        orgType: organization.type,
        orgSize: organization.size,
        contactName: contact.name,
        contactPhone: contact.phone,
        contactEmail: contact.email,
        source: '',
        paid: true,
        location: '',
      }));

      const transaction = this.prisma.$transaction([
        this.prisma.opportunitySubmission.createMany({
          data: prismaPayload,
        }),
      ]);
      return await this.prisma.opportunitySubmission.createMany({
        data: prismaPayload,
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        // TODO : Log e.message in Sentry
        throw new CAPPError(
          {
            title: 'Opportunity Submission Creation Error',
            detail:
              'Database error encountered when creating new opportunity submission',
            status: 400,
          },
          e instanceof Error ? { cause: e } : undefined,
        );
      }
      throw new CAPPError(
        {
          title: 'Opportunity Submission Creation Error',
          detail: 'Unknown error in creating opportunity submission',
          status: 500,
        },
        e instanceof Error ? { cause: e } : undefined,
      );
    }
  }
}

export default OpportunityController;
