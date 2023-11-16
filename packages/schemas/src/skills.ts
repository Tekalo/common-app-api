import { z } from 'zod';

const SkillGetResponseUnitSchema = z.object({
  name: z.string(),
});

const SkillGetResponseBodySchema = z.object({
  data: z.array(SkillGetResponseUnitSchema),
});

export default {
  SkillGetResponseBodySchema,
};
