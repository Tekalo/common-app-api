/**
 * Seed configuration data
 * Grant/Program/System Role types, Lines of Effort, Grant Stage/Status
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient, Prisma } from '@prisma/client';
import { randomInt } from 'crypto';
import CAPPError from '../../src/resources/shared/CAPPError.js';
import { Problem } from '../../src/resources/types/shared.js';
import seedData from './seed.json' assert { type: 'json' };

const prisma = new PrismaClient();

/**
 * We use Prisma.*CreateInput type here to ensure all required fields are included
 * even though we are doing upserts (to be defensive against duplicate data)
 */
type ApplicantType = Prisma.ApplicantCreateInput;
type ApplicantSubmissionType = Prisma.ApplicantSubmissionCreateInput;
type OpportunityBatchType = Prisma.OpportunityBatchCreateInput;

/**
 *
 * @param upsertPromises Upserts to execute
 * @returns Array of fulfilled promises
 * @throws CAPPError if any issues in the upsert
 */
async function doUpsert(
  upsertPromises: Array<
    | Promise<ApplicantType>
    | Promise<OpportunityBatchType>
    | Promise<ApplicantSubmissionType>
  >,
): Promise<Array<PromiseFulfilledResult<any>>> {
  let successful: Array<PromiseFulfilledResult<any>> = [];
  // eslint-disable-next-line no-console
  console.log('Beginning upsert');
  await Promise.allSettled(upsertPromises).then(
    (results: Array<PromiseSettledResult<any>>) => {
      // eslint-disable-next-line no-console
      console.log(`Number of results: ${results.length}`);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      successful = results.filter((result) => result.status === 'fulfilled');
      // eslint-disable-next-line no-console
      console.log(`Number of successful results: ${successful.length}`);
      const rejected: Array<PromiseRejectedResult> = results
        .filter((result) => result.status === 'rejected')
        .map((p) => p as PromiseRejectedResult);
      // eslint-disable-next-line no-console
      console.log(`Number of rejected results: ${rejected.length}`);
      if (rejected.length) {
        // eslint-disable-next-line no-console
        console.error(rejected[rejected.length - 1].reason); // Logging only the last error to get us on the right path of debugging
        const problem: Problem = {
          title: 'Insert failure',
          detail: `Failed to insert ${rejected.length} row${
            rejected.length > 1 ? 's' : ''
          }`,
          status: 500,
        };
        throw new CAPPError(problem);
      }
    },
  );
  return successful;
}

async function seedApplicantsAndApplicantSubmissions() {
  const { applicants } = seedData;
  const applicantsUpserts: Array<Promise<any>> = [];
  applicants.forEach((app) => {
    const {
      name,
      email,
      preferredContact,
      auth0Id,
      pronoun,
      searchStatus,
      application,
    } = app;
    const applicantUpsert = prisma.applicant.upsert({
      update: {},
      create: {
        name,
        auth0Id,
        email,
        pronoun: pronoun || undefined,
        preferredContact,
        searchStatus,
        applications: {
          create: {
            ...application,
            desiredSalary: String(randomInt(1000000)),
          },
        },
      },
      where: { email: app.email },
    });
    applicantsUpserts.push(applicantUpsert);
  });
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
        contactPhone: String(randomInt(1000000)),
        impactAreas: batch.impactAreas,
        equalOpportunityEmployer: batch.equalOpportunityEmployer,
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
  await seedApplicantsAndApplicantSubmissions();
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
