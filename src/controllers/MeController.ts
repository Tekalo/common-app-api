import {
  ApplicantResponseBody,
  ApplicantRequestBody,
  ApplicantSubmissionBody,
  ApplicantDraftSubmissionBody,
} from '@App/resources/types/applicants.js';
import CAPPError from '@App/resources/shared/CAPPError.js';
import {
  ApplicantDraftSubmission,
  ApplicantSubmission,
  Prisma,
  PrismaClient,
} from '@prisma/client';
import AuthService from '@App/services/AuthService.js';

class MeController {
  // private auth0Service: AuthService;

  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    // this.auth0Service = auth0Service;
    this.prisma = prisma;
  }

  async getSubmissions(applicantEmail: string) {}
}

export default MeController;
