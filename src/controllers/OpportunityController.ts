import { PrismaClient } from '@prisma/client';
import CAPPError from '@App/resources/shared/CAPPError.js';
import { Opportunities } from '@capp/schemas';
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
    const opportunitySubmissions = data.submissions.map((submission) => ({
      source: submission.source,
      paid: submission.paid,
      location: submission.location,
      pitchEssay: submission.pitchEssay,
      employmentType: submission.employmentType,
      roleType: submission.roleType,
      otherRoleType: submission.otherRoleType,
      positionTitle: submission.positionTitle,
      fullyRemote: submission.fullyRemote,
      salaryRange: submission.salaryRange,
      desiredHoursPerWeek: submission.desiredHoursPerWeek,
      desiredStartDate: submission.desiredStartDate,
      desiredEndDate: submission.desiredEndDate,
      jdUrl: submission.jdUrl,
      desiredYoe: submission.desiredYoe,
      desiredSkills: submission.desiredSkills,
      visaSponsorship: submission.visaSponsorship,
      similarStaffed: submission.similarStaffed,
      desiredImpactExp: submission.desiredImpactExp,
    }));
    const submissionDesiredSkills = data.submissions.flatMap(
      (submission) => submission.desiredSkills,
    );

    const {
      organization,
      contact,
      referenceAttribution,
      referenceAttributionOther,
    } = data;

    const batchCreate = this.prisma.opportunityBatch.create({
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
        utmParams: data.utmParams
          ? {
              create: {
                params: data.utmParams,
                event: 'create-batch',
              },
            }
          : undefined,
      },
    });

    const skillsCreate = this.prisma.opportunitySkills.createMany({
      data: submissionDesiredSkills.map((skill) => ({ name: skill })),
      skipDuplicates: true,
    });

    const causesCreate = this.prisma.opportunityCauses.createMany({
      data: organization.impactAreas
        ? organization.impactAreas.map((impact) => ({ name: impact }))
        : [],
      skipDuplicates: true,
    });

    const [batch] = await this.prisma.$transaction([
      batchCreate,
      skillsCreate,
      causesCreate,
    ]);

    const returnBatch: OpportunityBatchResponseBody = {
      eoe: batch.equalOpportunityEmployer,
      ...batch,
    };
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
    return Opportunities.OpportunityBatchResponseBodySchema.parse(returnBatch);
  }

  // Deletes specified opportunity batch immediately
  // Meant to be used by E2E tests and admins
  async deleteOpportunityForce(opportunityBatchId: number) {
    // Delete from opportunity batch table
    await this.prisma.opportunityBatch.delete({
      where: { id: opportunityBatchId },
    });
    return { id: opportunityBatchId };
  }

  // Deletes opportunity batches with known test contact email
  // Meant to be used by admins manualy
  async deleteTestOpportunities() {
    const testEmail = 'success+test-user-contact@simulator.amazonses.com';
    // Delete opportunity batches with test email
    return this.prisma.opportunityBatch.deleteMany({
      where: { contactEmail: testEmail },
    });
  }
}

export default OpportunityController;
