import UploadService from '@App/services/UploadService.js';
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
    const applicantId = 666;
    const originalFilename = 'myGreatResume.pdf';
    const contentType = 'application/pdf';

    mockCtx.prisma.upload.create.mockResolvedValue({
      id: 1,
      applicantId,
      type: 'RESUME',
      originalFilename,
      status: 'REQUESTED',
      createdAt: new Date(),
      completedAt: null,
      contentType: 'image/jpg',
    });

    const uploadService = new UploadService(
      ctx.prisma,
      dummyS3Service,
      mockConfig,
    );
    const resp = await uploadService.generateSignedResumeUploadUrl(
      applicantId,
      originalFilename,
      contentType,
    );
    expect(resp).toHaveProperty('id', 1);
    expect(resp).toHaveProperty(
      'signedLink',
      expect.stringMatching(
        `https://${mockConfig.uploadBucket}.*/resumes/${applicantId}.*`,
      ),
    );
  });

  test('should successfully generate a signed resume download url', async () => {
    const dummyS3Service = new DummyS3Service();
    const mockConfig = getMockConfig({
      uploadBucket: 'upload_bucket',
    });
    const applicantId = 666;
    const resumeId = 1;
    const originalFilename = 'myGreatResume.pdf';
    const contentType = 'application/pdf';

    mockCtx.prisma.upload.create.mockResolvedValue({
      id: resumeId,
      applicantId,
      type: 'RESUME',
      originalFilename,
      status: 'REQUESTED',
      createdAt: new Date(),
      completedAt: null,
      contentType: 'image/jpg',
    });

    const uploadService = new UploadService(
      ctx.prisma,
      dummyS3Service,
      mockConfig,
    );
    const resp = await uploadService.generateSignedResumeDownloadUrl(
      applicantId,
      resumeId,
      contentType,
    );
    expect(resp).toHaveProperty('id', resumeId);
    expect(resp).toHaveProperty(
      'signedLink',
      expect.stringMatching(
        `https://${mockConfig.uploadBucket}.*/resumes/${applicantId}.*`,
      ),
    );
  });

  describe('static Upload Service', () => {
    test('should return the correct file extension for a docx content type', () => {
      expect(
        UploadService.getFileExtensionFromContentType(
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ),
      ).toBe('docx');
    });
    test('returns pdf file extension even when content type includes charset', () => {
      expect(
        UploadService.getFileExtensionFromContentType(
          'application/pdf; charset=utf-8',
        ),
      ).toBe('pdf');
    });
    test('returns pdf file extension by default', () => {
      expect(UploadService.getFileExtensionFromContentType('foobar')).toBe(
        'pdf',
      );
    });
    test('', () => {
      expect(UploadService.generateS3Filename(1, 2, 'application/pdf')).toEqual(
        'resumes/1/2.pdf',
      );
    });
  });
});
