import CAPPError from '@App/resources/shared/CAPPError.js';
import UploadService from '@App/services/UploadService.js';
import DummyS3Service from '@App/tests/fixtures/DummyS3Service.js';
import { Prisma } from '@prisma/client';
import { createMockContext } from '../../util/context.js';

describe('Upload Service', () => {
  test('should throw error if uploads table does not have an upload belonging to the specified applicant', async () => {
    const mockCtx = createMockContext();
    const uploadService = new UploadService(
      mockCtx.prisma,
      new DummyS3Service(),
    );
    const prismaError = new Prisma.PrismaClientKnownRequestError('ERROR', {
      code: 'P2025',
      clientVersion: '1.0',
    });
    mockCtx.prisma.upload.findFirstOrThrow.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('ERROR', prismaError),
    );
    await expect(uploadService.verifyUploadOwner(1, 2)).rejects.toThrowError(
      new CAPPError(
        {
          title: 'Upload Error',
          detail:
            'Upload does not exist or does not belong to authenticated applicant',
          status: 400,
        },
        { cause: prismaError },
      ),
    );
  });
});
