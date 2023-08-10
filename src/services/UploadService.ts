import { Prisma, PrismaClient, Upload } from '@prisma/client';
import { GetObjectCommandOutput } from '@aws-sdk/client-s3';
import { ACCEPTED_CONTENT_TYPES } from '@App/resources/schemas/uploads.js';
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
    contentType: string,
  ): Promise<Upload> {
    try {
      return await this.prisma.upload.create({
        data: {
          originalFilename,
          applicantId,
          type: 'RESUME',
          status: 'REQUESTED',
          contentType,
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
      contentType,
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
    return ACCEPTED_CONTENT_TYPES.get(mediaType) || 'pdf';
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

  async getFileFromS3(
    uploadBucket: string,
    filePath: string,
  ): Promise<GetObjectCommandOutput> {
    try {
      const commandOutput: GetObjectCommandOutput =
        await this.s3Service.getObject(uploadBucket, filePath);
      return commandOutput;
    } catch (e) {
      console.log(e);
      throw new CAPPError(
        {
          title: 'Not Found',
          detail: 'File not found',
          status: 404,
        },
        e instanceof Error ? { cause: e } : undefined,
      );
    }
  }
}

export default UploadService;
