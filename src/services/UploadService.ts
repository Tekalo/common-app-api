import { Prisma, PrismaClient, Upload } from '@prisma/client';
import { Uploads } from '@Schemas/index.js';
import CAPPError from '@App/resources/shared/CAPPError.js';
import { BaseConfig } from '@App/resources/types/shared.js';

import S3Service from './S3Service.js';

// TODO: Rename this class as its not just doing uploads anymore
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

  async deleteApplicantResumes(applicantId: number) {
    await this.s3Service.deleteUploads(
      this.config.uploadBucket,
      `resumes/${applicantId}`,
    );
  }

  static generateS3Filename(
    applicantId: number,
    uploadId: number,
    contentType: string,
  ) {
    const fileExtension =
      UploadService.getFileExtensionFromContentType(contentType);
    return `resumes/${applicantId}/${uploadId}.${fileExtension}`;
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
    const signedLink = await this.s3Service.generateSignedUploadUrl(
      this.config.uploadBucket,
      UploadService.generateS3Filename(
        applicantId,
        uploadRecord.id,
        contentType,
      ),
      contentType,
    );
    return {
      id: uploadRecord.id,
      signedLink,
    };
  }

  static getFileExtensionFromContentType(contentType: string): string {
    const mediaType = contentType.split(';')[0];
    return Uploads.ACCEPTED_CONTENT_TYPES.get(mediaType) || 'pdf';
  }

  async generateSignedResumeDownloadUrl(
    applicantId: number,
    resumeUploadId: number,
    contentType: string,
  ) {
    const signedLink = await this.s3Service.generateSignedDownloadUrl(
      this.config.uploadBucket,
      UploadService.generateS3Filename(
        applicantId,
        resumeUploadId,
        contentType,
      ),
    );
    return {
      id: resumeUploadId,
      signedLink,
    };
  }
}

export default UploadService;
