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
      const prismaPromises = data.map(
        ({ organization, contact, ...oppFields }) =>
          this.prisma.opportunitySubmission.create({
            data: {
              orgName: organization.name,
              orgType: organization.type,
              orgSize: organization.size,
              contactName: contact.name,
              contactPhone: contact.phone,
              contactEmail: contact.email,
              source: oppFields.source,
              paid: oppFields.paid,
              location: oppFields.location,
              pitchEssay: oppFields.pitchEssay,
              type: oppFields.type,
              opportunityBatch: { create: {} },
            },
          }),
      );
      const result = await Promise.all(prismaPromises);
      return result.map((submission) => ({ id: submission.id }));
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
