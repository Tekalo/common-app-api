/* eslint-disable class-methods-use-this */
// import { UploadResponseBody } from '@App/resources/types/uploads.js';
import UploadService from '@App/services/UploadService.js';

class DummyUploadService extends UploadService {
  // eslint-disable-next-line @typescript-eslint/require-await
  // generateSignedResumeUploadUrl(): Promise<UploadResponseBody> {
  //   return Promise.resolve({
  //     id: 1,
  //     signedLink: 'https://bogus-signed-s3-link.com',
  //   });
  // }
}

export default DummyUploadService;
