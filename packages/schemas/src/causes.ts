import { z } from 'zod';

const CauseGetResponseUnitSchema = z.object({
  canonical: z.string().nullable(),
  priority: z.boolean(),
});

const CauseGetResponseBodySchema = z.object({
  data: z.array(CauseGetResponseUnitSchema),
});

export default { CauseGetResponseBodySchema };
