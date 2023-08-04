import { Prisma, PrismaClient, Upload } from '@prisma/client';
import CAPPError from '@App/resources/shared/CAPPError.js';
import { BaseConfig } from '@App/resources/types/shared.js';
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

  async createResumeUploadRecord(
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
    contentType: string,
  ) {
    const uploadRecord: Upload = await this.createResumeUploadRecord(
      originalFilename,
      applicantId,
    );
    const fileExtension =
      UploadService.getFileExtensionFromContentType(contentType);
    const signedLink = await this.s3Service.generateSignedUploadUrl(
      this.config.uploadBucket,
      `resumes/${applicantId}/${uploadRecord.id}.${fileExtension}`,
      contentType,
    );
    return {
      id: uploadRecord.id,
      signedLink,
    };
  }

  static getFileExtensionFromContentType(contentType: string): string {
    const mediaType = contentType.split(';')[0];
    switch (mediaType) {
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return 'docx';
      case 'image/jpeg':
      case 'image/jpg':
        return 'jpeg';
      case 'image/png':
        return 'png';
      case 'application/pdf':
      default:
        return 'pdf';
    }
  }
}

export default UploadService;
