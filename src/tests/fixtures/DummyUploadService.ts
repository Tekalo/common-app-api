/* eslint-disable class-methods-use-this */
import { PassThrough } from 'stream';
import { GetObjectCommandOutput } from '@aws-sdk/client-s3';
import UploadService from '@App/services/UploadService.js';

// TODO: Fix this never-closing stream
class DummyUploadService extends UploadService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getFileFromS3(uploadBucket: string, filePath: string) {
    const mockedStream = new PassThrough({ objectMode: true });
    return Promise.resolve({
      $metadata: {},
      Body: mockedStream,
    } as unknown as GetObjectCommandOutput);
  }
}

export default DummyUploadService;
