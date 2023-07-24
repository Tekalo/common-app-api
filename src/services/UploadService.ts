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

  async generateSignedResumeUploadUrl(
    applicantId: number,
    originalFilename: string,
    mimeType: string,
  ) {
    // TODO: create record in uploads table
    // use info from upload record to generate signed s3 link
    const uploadId = 123456;
    const contentType = UploadService.getContentType(mimeType);
    const signedLink = await this.s3Service.generateSignedUploadUrl(
      S3_BUCKET,
      `resumes/${applicantId}/${uploadId}.${mimeType}`,
      contentType,
    );

    return {
      uploadId,
      signedLink,
    };
  }

  static getContentType(mimeType: string): string {
    switch (mimeType) {
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'odt':
        return 'application/vnd.oasis.opendocument.text';
      case 'rtf':
        return 'application/rtf';
      case 'pdf':
      default:
        return 'application/pdf';
    }
  }
}

export default UploadService;
