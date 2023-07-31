import UploadService from '@App/services/UploadService.js';
import CAPPError from '@App/resources/shared/CAPPError.js';
import DummyS3Service from '../../fixtures/DummyS3Service.js';
import { getMockConfig } from '../../util/helpers.js';
import { MockContext, Context, createMockContext } from '../../util/context.js';

let mockCtx: MockContext;
let ctx: Context;

beforeEach(() => {
  mockCtx = createMockContext();
  ctx = mockCtx as unknown as Context;
});

describe('Upload Service', () => {
  test('should successfully generate a signed resume upload url', async () => {
    const dummyS3Service = new DummyS3Service();
    const mockConfig = getMockConfig({
      uploadBucket: 'upload_bucket',
    });
    const uploadService = new UploadService(
      ctx.prisma,
      dummyS3Service,
      mockConfig,
    );
    const applicantId = 666;
    const originalFilename = 'myGreatResume.pdf';
    const mimeType = 'pdf';

    const resp = await uploadService.generateSignedResumeUploadUrl(
      applicantId,
      originalFilename,
      mimeType,
    );
    expect(resp).toHaveProperty('uploadId', 123456);
    expect(resp).toHaveProperty(
      'signedLink',
      expect.stringMatching(
        `https://${mockConfig.uploadBucket}.*/resumes/${applicantId}.*`,
      ),
    );
  });

  test('should throw error if upload belonging to the specified applicant does not exist', async () => {
    const uploadService = new UploadService(
      mockCtx.prisma,
      new DummyS3Service(),
      getMockConfig(),
    );
    mockCtx.prisma.upload.findFirst.mockResolvedValue(null);
    await expect(
      uploadService.getApplicantUploadOrThrow(1, 2),
    ).rejects.toThrowError(
      new CAPPError({
        title: 'Upload Error',
        detail:
          'Upload does not exist or does not belong to authenticated applicant',
        status: 400,
      }),
    );
  });

  describe('static Upload Service', () => {
    test('should return the correct mime type for a docx', () => {
      expect(UploadService.getContentType('docx')).toBe(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      );
    });
    test('returns pdf mime type by default', () => {
      expect(UploadService.getContentType('foobar')).toBe('application/pdf');
    });
  });
});
