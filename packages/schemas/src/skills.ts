import { z } from 'zod';

const SkillGetResponseUnitSchema = z.object({
  name: z.string(),
});

const SkillGetResponseBodySchema = z.object({
  data: z.array(SkillGetResponseUnitSchema),
});

const ReferenceSkillsCreateRequestBodySchema = z.object({
  name: z.string(),
  referenceId: z.string(),
});

const ReferenceSkillsCreateResponseBodySchema = z.object({
  name: z.string(),
  referenceId: z.string(),
});

export default {
  SkillGetResponseBodySchema,
  ReferenceSkillsCreateRequestBodySchema,
  ReferenceSkillsCreateResponseBodySchema,
};
