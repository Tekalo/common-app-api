import {
  UploadResponseBody,
  UploadRequestBody,
} from '@App/resources/types/uploads.js';

import UploadService from '@App/services/UploadService.js';

class UploadController {
  private uploadService: UploadService;

  constructor(uploadService: UploadService) {
    this.uploadService = uploadService;
  }

  async getResumeUploadUrl(
    applicantId: number,
    data: UploadRequestBody,
  ): Promise<UploadResponseBody> {
    // create record in db
    // use s3 service to generate a url
    await this.uploadService.generateSignedResumeUploadUrl(
      applicantId,
      data.originalFilename || 'signedLink',
    );
    // TODO
    return {
      uploadId: 12345,
      signedLink: data.originalFilename || 'signedLink',
    };
  }
}

export default UploadController;
