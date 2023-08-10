import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  ListObjectsV2CommandOutput,
  S3Client,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import logger from '@App/services/logger.js';
import CAPPError from '@App/resources/shared/CAPPError.js';

class S3Service {
  static getS3Client() {
    return new S3Client({});
  }

  /* eslint-disable class-methods-use-this */
  async generateSignedUploadUrl(
    bucket: string,
    key: string,
    contentType: string,
  ) {
    const s3Client = S3Service.getS3Client();
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    });
    const url = await getSignedUrl(s3Client, command);
    return url;
  }

  async deleteUploads(bucket: string, prefix: string) {
    const s3Client = S3Service.getS3Client();
    const listUploadsCommand = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
    });
    const uploadsToDelete: ListObjectsV2CommandOutput = await s3Client.send(
      listUploadsCommand,
    );
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
      const deleted = await s3Client.send(deleteCommand); // delete the files

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
}

export default S3Service;
