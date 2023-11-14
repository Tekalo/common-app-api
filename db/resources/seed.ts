/* eslint-disable @typescript-eslint/no-explicit-any */
import { randomInt } from 'crypto';
import { PrismaClient, Prisma, UploadStatus } from '@prisma/client';
import { Applicants, Opportunities, Uploads } from '@capp/schemas';
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

async function seedApplicantSubmissions() {
  const { applicants, resumes } = seedData;
  const applicantsUpserts: Array<Promise<any>> = [];
  const submissionUpserts: Array<Promise<any>> = [];
  const resumeUploadUpserts: Array<Promise<any>> = [];
  applicants.forEach((app, idx) => {
    const validatedApp = Applicants.ApplicantCreateRequestBodySchema.parse(app);
    const validatedSubmission =
      Applicants.ApplicantCreateSubmissionRequestBodySchema.parse(
        app.application,
      );
    const { status, applicantId, ...restOfResume } = resumes[idx];
    const validatedResume = Uploads.UploadRequestBodySchema.parse(restOfResume);
    const { name, email, preferredContact, pronoun, searchStatus } =
      validatedApp;
    const applicantUpsert = prisma.applicant.upsert({
      update: {},
      create: {
        name,
        auth0Id: app.auth0Id,
        email,
        pronoun: pronoun || undefined,
        preferredContact,
        searchStatus,
        phone: String(randomInt(1000000)),
      },
      where: { email },
    });
    const resumeUploadUpsert = prisma.upload.upsert({
      update: {},
      create: {
        originalFilename: validatedResume.originalFilename,
        contentType: validatedResume.contentType,
        type: 'RESUME',
        applicantId,
        status: status as UploadStatus,
      },
      where: { id: resumes[idx].id },
    });
    const submissionUpsert = prisma.applicantSubmission.upsert({
      update: {},
      where: { id: app.application.id },
      create: {
        ...validatedSubmission,
        resumeUpload: {
          connect: { id: validatedSubmission.resumeUpload.id },
        },
        utmParams: undefined,
        applicant: { connect: { id: app.application.id } },
      },
    });
    applicantsUpserts.push(applicantUpsert);
    resumeUploadUpserts.push(resumeUploadUpsert);
    submissionUpserts.push(submissionUpsert);
  });
  await doUpsert(applicantsUpserts);
  await doUpsert(resumeUploadUpserts);
  await doUpsert(submissionUpserts);
}

async function seedOpportunitySubmissionBatches() {
  const { opportunityBatches } = seedData;
  const opportunityBatchUpserts = opportunityBatches.map((batch) => {
    const { organization, submissions, contact } =
      Opportunities.OpportunityBatchRequestBodySchema.parse(batch);
    return prisma.opportunityBatch.upsert({
      create: {
        id: batch.id,
        orgName: organization.name,
        orgSize: organization.size,
        orgType: organization.type,
        contactEmail: contact.email,
        contactName: contact.name,
        contactPhone: String(randomInt(1000000)),
        impactAreas: organization.impactAreas,
        equalOpportunityEmployer: organization.eoe,
        opportunitySubmissions: {
          createMany: {
            data: submissions,
          },
        },
      },
      update: {},
      where: { id: batch.id },
    });
  });
  await doUpsert(opportunityBatchUpserts);
}

async function seedSkills() {
  const { skills } = seedData;
  const skillsUpserts: Array<Promise<any>> = skills.map((skill) =>
    prisma.skill.upsert({
      update: {},
      create: {
        name: skill,
      },
      where: { name: skill }, // unique key
    }),
  );
  await doUpsert(skillsUpserts);
}

//   const { skills } = seedData;
//   const skillsUpserts: Array<Promise<any>> = [];
//   // eslint-disable-next-line @typescript-eslint/no-unused-vars
//   skills.forEach((name, _idx) => {
//     const skillUpsert = prisma.skill.upsert({
//       update: {},
//       create: {
//         name,
//       },
//       where: { name }, // unique key
//     });
//     skillsUpserts.push(skillUpsert);
//   });

//   await doUpsert(skillsUpserts);
// }

async function main() {
  await seedSkills();
  await seedApplicantSubmissions();
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
