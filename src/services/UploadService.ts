import CAPPError from '@App/resources/shared/CAPPError.js';
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
   * Get upload belonging to an applicant. If it does not exist, throw an error.
   * @param applicantId
   * @param uploadId
   * @returns
   */
  async getApplicantUploadOrThrow(
    applicantId: number,
    uploadId: number,
  ): Promise<Upload> {
    const applicantUpload = await this.prisma.upload.findFirst({
      where: { id: uploadId, applicantId },
    });
    if (!applicantUpload) {
      throw new CAPPError({
        title: 'Upload Error',
        detail:
          'Upload does not exist or does not belong to authenticated applicant',
        status: 400,
      });
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
