import CAPPError from '@App/resources/shared/CAPPError.js';
import UploadService from '@App/services/UploadService.js';
import DummyS3Service from '@App/tests/fixtures/DummyS3Service.js';
import { createMockContext } from '../../util/context.js';

describe('Upload Service', () => {
  test('should throw error if upload belonging to the specified applicant does not exist', async () => {
    const mockCtx = createMockContext();
    const uploadService = new UploadService(
      mockCtx.prisma,
      new DummyS3Service(),
    );
    mockCtx.prisma.upload.findFirst.mockResolvedValue(null);
    await expect(uploadService.getApplicantUpload(1, 2)).rejects.toThrowError(
      new CAPPError({
        title: 'Upload Error',
        detail:
          'Upload does not exist or does not belong to authenticated applicant',
        status: 400,
      }),
    );
  });
});
