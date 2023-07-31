import { PrismaClient, Upload } from '@prisma/client';
import { BaseConfig } from '@App/resources/types/shared.js';
import CAPPError from '@App/resources/shared/CAPPError.js';
import S3Service from './S3Service.js';

class UploadService {
  private s3Service: S3Service;

  private prisma: PrismaClient;

  private config: BaseConfig;

  constructor(prisma: PrismaClient, s3Service: S3Service, config: BaseConfig) {
    this.prisma = prisma;
    this.s3Service = s3Service;
    this.config = config;
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
    mimeType: string,
  ) {
    // TODO: create record in uploads table
    // use info from upload record to generate signed s3 link
    const uploadId = 123456;
    const contentType = UploadService.getContentType(mimeType);
    const signedLink = await this.s3Service.generateSignedUploadUrl(
      this.config.uploadBucket,
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
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'pdf':
      default:
        return 'application/pdf';
    }
  }
}

export default UploadService;
