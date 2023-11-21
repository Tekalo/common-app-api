import { z } from 'zod';

const SkillGetResponseUnitSchema = z.object({
  name: z.string(),
});

const SkillGetResponseBodySchema = z.object({
  data: z.array(SkillGetResponseUnitSchema),
});

const ReferenceSkillsCreateRequestUnitSchema = z.object({
  name: z.string(),
  referenceId: z.string(),
});

const ReferenceSkillsCreateRequestBodySchema = z.array(
  ReferenceSkillsCreateRequestUnitSchema,
);

const ReferenceSkillsCreateResponseBodySchema = z.object({
  successCount: z.number(),
});

export default {
  SkillGetResponseBodySchema,
  ReferenceSkillsCreateRequestBodySchema,
  ReferenceSkillsCreateResponseBodySchema,
};
