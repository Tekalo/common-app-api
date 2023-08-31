import { PrismaClient, Upload } from '@prisma/client';
import { ACCEPTED_CONTENT_TYPES } from '@App/resources/schemas/uploads.js';
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
    const upload = await this.prisma.upload.create({
      data: {
        originalFilename,
        applicantId,
        type: 'RESUME',
        status: 'REQUESTED',
        contentType,
      },
    });
    return upload;
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
    const applicantUpload = await this.prisma.upload.findFirstOrThrow({
      where: { id: uploadId, applicantId },
    });
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
    return ACCEPTED_CONTENT_TYPES.get(mediaType) || 'pdf';
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
