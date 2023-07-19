import {
  UploadResponseBody,
  UploadRequestBody,
} from '@App/resources/types/uploads.js';

import { PrismaClient } from '@prisma/client';

class UploadController {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async createSignedUploadLink(
    applicantId: number,
    data: UploadRequestBody,
  ): Promise<UploadResponseBody> {
    await this.prisma.applicant.findFirstOrThrow({
      where: { id: applicantId },
    });
    return {
      uploadId: 12345,
      signedLink: data.originalFilename || 'signedLink',
    };
  }
}

export default UploadController;
