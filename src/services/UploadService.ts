import { PrismaClient } from '@prisma/client';
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

  //
  async generateSignedResumeUploadUrl(
    applicantId: number,
    originalFilename: string,
  ) {
    // TODO: create record in uploads table

    // use info from record create to generate signed s3 link
    await this.s3Service.generateSignedUploadUrl(
      S3_BUCKET,
      `resumes/${applicantId}/123456`,
    );
    return {
      uploadId: 12345,
      signedLink: originalFilename || 'signedLink',
    };
  }
}

export default UploadService;
