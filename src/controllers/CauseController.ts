import { CauseGetResponseBody } from '@App/resources/types/causes.js';
import { PrismaClient } from '@prisma/client';
import { Causes } from '@capp/schemas';

class CauseController {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async getCauses(): Promise<CauseGetResponseBody> {
    // De-duplicate the same canonical cause name regardless of casing and return records with priority=true if duplicate records exist
    const causes = await this.prisma
      .$queryRaw`SELECT canonical, sum(cast(priority as int)) > 0 as priority FROM "CausesView" WHERE suggest = true AND "rejectAs" IS NULL GROUP BY canonical`;
    return Causes.CauseGetResponseBodySchema.parse({
      data: causes,
    });
  }
}

export default CauseController;
