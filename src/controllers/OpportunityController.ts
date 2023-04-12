import CAPPError from '@App/resources/shared/CAPPError.js';
import { Prisma, PrismaClient } from '@prisma/client';
import {
  OpportunityBatchRequestBody,
  OpportunityBatchResponseBody,
} from '@App/resources/types/opportunities.js';

class OpportunityController {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async createOpportunityBatch(
    data: OpportunityBatchRequestBody,
  ): Promise<OpportunityBatchResponseBody> {
    try {
      const opportunitySubmissions = data.submissions.map((submission) => ({
        source: submission.source,
        paid: submission.paid,
        location: submission.location,
        pitchEssay: submission.pitchEssay,
        employmentType: submission.employmentType,
        roleType: submission.roleType,
        positionTitle: submission.positionTitle,
        fullyRemote: submission.fullyRemote,
        salaryRange: submission.salaryRange,
        desiredHoursPerWeek: submission.desiredHoursPerWeek,
        desiredStartDate: submission.desiredStartDate,
        desiredEndDate: submission.desiredEndDate,
        jdUrl: submission.jdUrl,
        desiredYoe: submission.desiredYoe,
        desiredSkills: submission.desiredSkills,
        desiredOtherSkills: submission.desiredOtherSkills,
        visaSponsorship: submission.visaSponsorship,
        similarStaffed: submission.similarStaffed,
        desiredImpactExp: submission.desiredImpactExp,
      }));
      const { organization, contact } = data;
      return await this.prisma.opportunityBatch.create({
        data: {
          orgName: organization.name,
          orgType: organization.type,
          orgSize: organization.size,
          contactName: contact.name,
          contactPhone: contact.phone,
          contactEmail: contact.email,
          equalOpportunityEmployer: organization.eoe,
          opportunitySubmissions: {
            createMany: {
              data: opportunitySubmissions,
            },
          },
        },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        // TODO : Log e.message in Sentry
        throw new CAPPError(
          {
            title: 'Opportunity Submission Creation Error',
            detail:
              'Database error encountered when creating new opportunity batch',
            status: 400,
          },
          e instanceof Error ? { cause: e } : undefined,
        );
      }
      throw new CAPPError(
        {
          title: 'Opportunity Submission Creation Error',
          detail: 'Unknown error in creating opportunity batch',
          status: 500,
        },
        e instanceof Error ? { cause: e } : undefined,
      );
    }
  }
}

export default OpportunityController;
