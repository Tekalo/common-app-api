/**
 * Seed configuration data
 * Grant/Program/System Role types, Lines of Effort, Grant Stage/Status
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient, Prisma } from '@prisma/client';
import CAPPError from '../../src/resources/shared/CAPPError.js';
import { Problem } from '../../src/resources/types/shared.js';
import seedData from './seed.json' assert { type: 'json' };

const prisma = new PrismaClient();

/**
 * We use Prisma.*CreateInput type here to ensure all required fields are included
 * even though we are doing upserts (to be defensive against duplicate data)
 */
type ApplicantType = Prisma.ApplicantCreateInput;
type OpportunityBatchType = Prisma.OpportunityBatchCreateInput;

/**
 *
 * @param upsertPromises Upserts to execute
 * @returns Array of fulfilled promises
 * @throws CAPPError if any issues in the upsert
 */
async function doUpsert(
  upsertPromises: Array<Promise<ApplicantType> | Promise<OpportunityBatchType>>,
): Promise<Array<PromiseFulfilledResult<any>>> {
  let successful: Array<PromiseFulfilledResult<any>> = [];
  await Promise.allSettled(upsertPromises).then(
    (results: Array<PromiseSettledResult<any>>) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      successful = results.filter((result) => result.status === 'fulfilled');
      const rejected: Array<PromiseRejectedResult> = results
        .filter((result) => result.status === 'rejected')
        .map((p) => p as PromiseRejectedResult);
      if (rejected.length) {
        // eslint-disable-next-line no-console
        console.error(rejected[rejected.length - 1].reason); // Logging only the last error to get us on the right path of debugging
        const problem: Problem = {
          title: 'Insert failure',
          detail: `Failed to insert ${rejected.length} row${rejected.length > 1 ? 's' : ''
            }`,
          status: 500,
        };
        throw new CAPPError(problem);
      }
    },
  );
  return successful;
}

async function seedApplicants() {
  const { applicants }: { applicants: Array<ApplicantType> } = seedData;
  const applicantsUpserts = applicants.map((app) =>
    prisma.applicant.upsert({
      update: {},
      create: {
        ...app,
      },
      where: { email: app.email },
    }),
  );
  await doUpsert(applicantsUpserts);
}

async function seedOpportunitySubmissionBatches() {
  const { opportunityBatches } = seedData;
  const opportunityBatchUpserts = opportunityBatches.map((batch) =>
    prisma.opportunityBatch.create({
      data: {
        orgName: batch.orgName,
        orgSize: batch.orgSize,
        orgType: batch.orgType,
        contactEmail: batch.contactEmail,
        contactName: batch.contactName,
        contactPhone: batch.contactPhone,
        opportunitySubmissions: {
          createMany: {
            data: batch.submissions,
          },
        },
      },
    }),
  );
  await doUpsert(opportunityBatchUpserts);
}

async function main() {
  await seedApplicants();
  await seedOpportunitySubmissionBatches();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
