import CAPPError from '@App/resources/shared/CAPPError.js';
import { PrismaClient, Upload } from '@prisma/client';
import S3Service from './S3Service.js';

// TODO: env variable
const S3_BUCKET = 'capp-dev-api-uploads';

class UploadService {
  // If applicant does not match upload being attached, throw an error
  async verifyUploadOwner(
    applicantId: number,
    resumeUploadId: number,
  ): Promise<Upload> {
    try {
      return await this.prisma.upload.findFirstOrThrow({
        where: { id: resumeUploadId, applicantId },
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

  private s3Service: S3Service;

  private prisma: PrismaClient;

  constructor(prisma: PrismaClient, s3Service: S3Service) {
    this.prisma = prisma;
    this.s3Service = s3Service;
  }

  //
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
