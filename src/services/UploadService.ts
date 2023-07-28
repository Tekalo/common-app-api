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
   * Verify that the uploadId belongs to the applicant with the specified ID. If not, throw an error
   * applicantId should always be the ID of the authenticated applicant.
   */
  async verifyUploadOwner(
    applicantId: number,
    uploadId: number,
  ): Promise<Upload> {
    try {
      return await this.prisma.upload.findFirstOrThrow({
        where: { id: uploadId, applicantId },
      });
    } catch (e) {
      throw new CAPPError(
        {
          title: 'Upload Error',
          detail:
            'Upload does not exist or does not belong to authenticated applicant',
          status: 400,
        },
        e instanceof Error ? { cause: e } : undefined,
      );
    }
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
