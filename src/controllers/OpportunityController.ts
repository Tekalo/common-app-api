import { PrismaClient } from '@prisma/client';
import CAPPError from '@App/resources/shared/CAPPError.js';
import { Opportunities } from '@capp/schemas';
import {
  OpportunityBatchRequestBody,
  OpportunityBatchResponseBody,
  OpportunitySubmission,
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
    const opportunitySubmissions: Array<OpportunitySubmission> = [];
    const batchDesiredSkills: Array<string> = [];
    data.submissions.forEach((submission) => {
      opportunitySubmissions.push({
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
        desiredOtherSkills: submission.desiredOtherSkills,
        visaSponsorship: submission.visaSponsorship,
        similarStaffed: submission.similarStaffed,
        desiredImpactExp: submission.desiredImpactExp,
      });
      batchDesiredSkills.push(...submission.desiredSkills);
    });

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
        impactAreasOther: organization.impactAreasOther || [],
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

    const skillsCreate = this.prisma.orgSkills.createMany({ data: batchDesiredSkills.map((skill) => ({ name: skill })), skipDuplicates: true });

    const [ batch, skills ] = await this.prisma.$transaction([
      batchCreate, skillsCreate,
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
    const oldTestEmail = 'test-user-contact@schmidtfutures.com';
    const testEmail = 'success+test-user-contact@simulator.amazonses.com';
    // Delete opportunity batches with test email
    return this.prisma.opportunityBatch.deleteMany({
      where: {
        OR: [{ contactEmail: testEmail }, { contactEmail: oldTestEmail }],
      },
    });
  }
}

export default OpportunityController;
