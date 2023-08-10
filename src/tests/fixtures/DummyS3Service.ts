/* eslint-disable class-methods-use-this */
import { Readable } from 'node:stream';
import { GetObjectCommandOutput } from '@aws-sdk/client-s3';
import S3Service from '@App/services/S3Service.js';

class DummyS3Service extends S3Service {
  async generateSignedUploadUrl(
    bucket: string,
    key: string,
    contentType: string,
  ) {
    const url = `https://${bucket}.s3.us-east-1.amazonaws.com/${key}?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&Content-Type=${contentType}&X-Amz-Credential=XXXX%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20230724T211311Z&X-Amz-Expires=900&X-Amz-SignedHeaders=host&x-id=PutObject`;
    return Promise.resolve(url);
  }

  async getObject() {
    return Promise.resolve({
      $metadata: {},
      Body: new Readable(),
    } as unknown as GetObjectCommandOutput);
  }
}

export default DummyS3Service;
