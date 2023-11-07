import { z } from 'zod'

const SkillGetResponseBodySchema = z.object({
    name: z.string(),
});

export default {
    SkillGetResponseBodySchema,
};