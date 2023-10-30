import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  ListObjectsV2CommandOutput,
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { createPresignedPost, PresignedPost } from '@aws-sdk/s3-presigned-post';
import logger from '@App/services/logger.js';
import CAPPError from '@App/resources/shared/CAPPError.js';
import { Upload } from '@prisma/client';

/** Smallest size in bytes that we will accept for an upload. */
const UPLOAD_SIZE_MIN = 100;

/** Largest size (in bytes) that we will accept for an upload. */
const UPLOAD_SIZE_MAX = 10 * 1024 * 1024;

class S3Service {
  constructor(public s3Client: S3Client = S3Service.getS3Client()) {}

  protected static getS3Client() {
    return new S3Client({});
  }

  /* eslint-disable class-methods-use-this */
  async generateSignedUploadUrl(
    bucket: string,
    key: string,
    contentType: string,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    });
    const url = await getSignedUrl(this.s3Client, command);
    return url;
  }

  /* eslint-disable class-methods-use-this */
  async generateSignedPostUploadUrl(
    bucket: string,
    key: string,
    contentType: string,
    uploadRecord: Upload,
  ): Promise<PresignedPost> {
    return createPresignedPost(this.s3Client, {
      Bucket: bucket,
      Key: key,
      Expires: 600,
      Conditions: [['content-length-range', UPLOAD_SIZE_MIN, UPLOAD_SIZE_MAX]],
      Fields: {
        acl: 'bucket-owner-full-control',
        'Content-Type': contentType,
        'x-amz-meta-uploaded-by-applicant-id':
          uploadRecord.applicantId.toString(),
        'x-amz-meta-upload-id': uploadRecord.id.toString(),
      },
    });
  }

  async deleteUploads(bucket: string, prefix: string) {
    const listUploadsCommand = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
    });
    const uploadsToDelete: ListObjectsV2CommandOutput =
      await this.s3Client.send(listUploadsCommand);
    if (uploadsToDelete && uploadsToDelete.KeyCount) {
      // if items to delete
      // delete the files
      const deleteCommand = new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: {
          Objects: uploadsToDelete.Contents?.map((item) => ({ Key: item.Key })), // array of keys to be deleted
          Quiet: false, // provides info on successful deletes
        },
      });
      const deleted = await this.s3Client.send(deleteCommand); // delete the files

      // log any errors deleting files
      if (deleted.Errors) {
        deleted.Errors.map((error) =>
          logger.error(`${error.Key} could not be deleted - ${error.Code}`),
        );
        throw new CAPPError({
          title: 'Uploaded file deletion error',
          detail: `There was a problem deleting uploaded files from ${bucket}/${prefix}`,
          status: 400,
        });
      }
      logger.info(`${deleted.Deleted?.length} file(s) deleted.`);
    } else {
      logger.info(`No uploads to delete for ${prefix}`);
    }
  }

  async generateSignedDownloadUrl(bucket: string, key: string) {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    const url = await getSignedUrl(this.s3Client, command);
    return url;
  }
}

export default S3Service;
