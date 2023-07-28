import CAPPError from '@App/resources/shared/CAPPError.js';
import { Problem } from '@App/resources/types/shared.js';
import { PrismaClient, Upload } from '@prisma/client';
import S3Service from './S3Service.js';

// TODO: env variable
const S3_BUCKET = 'capp-dev-api-uploads';

class UploadService {
  private s3Service: S3Service;

  private prisma: PrismaClient;

  constructor(prisma: PrismaClient, s3Service: S3Service) {
    this.prisma = prisma;
    this.s3Service = s3Service;
  }

  /**
   * Verify that the uploadId belongs to the applicant with the specified ID. If not, throw an error
   * applicantId should always be the ID of the authenticated applicant.
   */
  async validateUploadForSubmission(
    applicantId: number,
    uploadId: number,
  ): Promise<Upload> {
    const applicantUpload = await this.prisma.upload.findFirst({
      where: { id: uploadId, applicantId },
    });
    const problem: Problem = {
      title: 'Upload Error',
      status: 400,
    };
    if (!applicantUpload) {
      problem.detail =
        'Upload does not exist or does not belong to authenticated applicant';
      throw new CAPPError(problem);
    }
    if (applicantUpload.status !== 'SUCCESS') {
      problem.detail = 'Upload does not have a valid status';
      throw new CAPPError(problem);
    }
    return applicantUpload;
  }

  async generateSignedResumeUploadUrl(
    applicantId: number,
    originalFilename: string,
  ) {
    // TODO: create record in uploads table

    // use info from record create to generate signed s3 link
    await this.s3Service.generateSignedUploadUrl(S3_BUCKET, 'my_key');
    return {
      uploadId: 12345,
      signedLink: originalFilename || 'signedLink',
    };
  }
}

export default UploadService;
