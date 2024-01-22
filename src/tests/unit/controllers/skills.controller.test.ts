import { Prisma } from '@prisma/client';
import {
  MockContext,
  Context,
  createMockContext,
} from '@App/tests/util/context.js';
import SkillController from '@App/controllers/SkillController.js';
import { ReferenceSkillsCreateRequestBody } from '@App/resources/types/skills.js';

let mockCtx: MockContext;
let ctx: Context;

beforeEach(() => {
  mockCtx = createMockContext();
  ctx = mockCtx as unknown as Context;
});

describe('Skill Controller', () => {
  test('Should return error when Prisma throws an upsert error', async () => {
    const mockError = new Prisma.PrismaClientKnownRequestError('ERROR', {
      code: '101',
      clientVersion: '1.0',
    });
    mockCtx.prisma.referenceSkills.upsert.mockRejectedValue(mockError);

    const skillController = new SkillController(ctx.prisma);

    const reqPayload: ReferenceSkillsCreateRequestBody = [
      {
        name: 'TypeScript',
        referenceId: 'ET3B93055220D592C8',
      },
      {
        name: 'JavaScript',
        referenceId: 'ET3B93055220D592C9',
      },
      {
        name: 'Python',
        referenceId: 'ET3B93055220D592C10',
      },
    ];

    await expect(
      skillController.createReferenceSkills(reqPayload),
    ).rejects.toEqual(mockError);
  });
});
