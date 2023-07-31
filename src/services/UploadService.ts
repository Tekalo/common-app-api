import CAPPError from '@App/resources/shared/CAPPError.js';
import { BaseConfig } from '@App/resources/types/shared.js';
import { Prisma, PrismaClient, Upload } from '@prisma/client';
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

  async createUploadRecord(
    originalFilename: string,
    applicantId: number,
  ): Promise<Upload> {
    try {
      return await this.prisma.upload.create({
        data: {
          originalFilename,
          applicantId,
          type: 'RESUME',
          status: 'REQUESTED',
        },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        throw new CAPPError(
          {
            title: 'Upload Error',
            detail: 'Failed to save resume to database',
            status: 400,
          },
          e instanceof Error ? { cause: e } : undefined,
        );
      }
      throw new CAPPError(
        {
          title: 'Upload Error',
          detail: 'Failed to upload resume',
        },
        e instanceof Error ? { cause: e } : undefined,
      );
    }
  }

  async generateSignedResumeUploadUrl(
    applicantId: number,
    originalFilename: string,
    mimeType: string,
  ) {
    const uploadRecord: Upload = await this.createUploadRecord(
      originalFilename,
      applicantId,
    );
    const contentType = UploadService.getContentType(mimeType);
    const signedLink = await this.s3Service.generateSignedUploadUrl(
      this.config.uploadBucket,
      `resumes/${applicantId}/${uploadRecord.id}.${mimeType}`,
      contentType,
    );

    return {
      id: uploadRecord.id,
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
