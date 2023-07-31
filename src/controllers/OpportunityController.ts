import { Prisma, PrismaClient } from '@prisma/client';
import CAPPError from '@App/resources/shared/CAPPError.js';
import {
  OpportunityBatchRequestBody,
  OpportunityBatchResponseBody,
} from '@App/resources/types/opportunities.js';
import EmailService from '@App/services/EmailService.js';
import MonitoringService from '@App/services/MonitoringService.js';

class OpportunityController {
  private prisma: PrismaClient;

  private emailService: EmailService;

  constructor(prisma: PrismaClient, emailService: EmailService) {
    this.prisma = prisma;
    this.emailService = emailService;
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
      const {
        organization,
        contact,
        referenceAttribution,
        referenceAttributionOther,
      } = data;
      const returnBatch: OpportunityBatchResponseBody =
        await this.prisma.opportunityBatch.create({
          data: {
            orgName: organization.name,
            orgType: organization.type,
            orgSize: organization.size,
            impactAreas: organization.impactAreas,
            contactName: contact.name,
            contactPhone: contact.phone,
            contactEmail: contact.email,
            equalOpportunityEmployer: organization.eoe,
            referenceAttribution,
            referenceAttributionOther,
            opportunitySubmissions: {
              createMany: {
                data: opportunitySubmissions,
              },
            },
          },
        });
      try {
        const welcomeEmail = this.emailService.generateOrgWelcomeEmail(
          returnBatch.contactEmail,
        );
        await this.emailService.sendEmail(welcomeEmail);
      } catch (e) {
        MonitoringService.logError(
          new CAPPError(
            { title: 'Failed to send org intake form welcome email' },
            e instanceof Error ? { cause: e } : undefined,
          ),
        );
      }
      return returnBatch;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
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

  // Deletes specified opportunity batch immediately
  // Meant to be used by E2E tests and admins
  async deleteOpportunityForce(opportunityBatchId: number) {
    try {
      // Delete from opportunity batch table
      await this.prisma.opportunityBatch.delete({
        where: { id: opportunityBatchId },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        throw new CAPPError(
          {
            title: 'Opportunity Batch Deletion Error',
            detail:
              'Database error encountered when deleting opportunity batch',
            status: 400,
          },
          e instanceof Error ? { cause: e } : undefined,
        );
      }
      throw new CAPPError(
        {
          title: 'Opportunity Batch Deletion Error',
          detail: 'Error when deleting opportunity batch',
        },
        e instanceof Error ? { cause: e } : undefined,
      );
    }
    return { id: opportunityBatchId };
  }
}

export default OpportunityController;
