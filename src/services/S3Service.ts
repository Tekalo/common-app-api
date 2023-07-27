import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

class S3Service {
  static getS3Client() {
    return new S3Client({});
  }

  // https://fourtheorem.com/the-illustrated-guide-to-s3-pre-signed-urls/
  /* eslint-disable class-methods-use-this */
  async generateSignedUploadUrl(bucket: string, key: string) {
    const s3Client = S3Service.getS3Client();
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    const url = await getSignedUrl(s3Client, command);
    return url;
  }
}

export default S3Service;