import { Prisma, PrismaClient } from '@prisma/client';
import CAPPError from '../src/resources/shared/CAPPError.js';

const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'error',
    },
  ],
});

type LightcastTokenResponse = {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
};

type LightcastSkill = {
  id: string;
  name: string;
  category: {
    id: number;
    name: string;
  };
};
type LightcastSkillsResponse = {
  data: Array<LightcastSkill>;
  attributions: Array<{
    name: string;
    text: string;
  }>;
};

const getLightcastSkills = async () => {
  const urlEncodedBody = new URLSearchParams({
    client_id: process.env.LIGHTCAST_CLIENT_ID as string,
    client_secret: process.env.LIGHTCAST_CLIENT_SECRET as string,
    grant_type: 'client_credentials',
    scope: 'emsi_open',
  });
  const tokenResponse = await fetch(
    'https://auth.emsicloud.com/connect/token',
    {
      method: 'POST',
      headers: new Headers({
        'Content-Type': 'application/x-www-form-urlencoded',
      }),
      body: urlEncodedBody,
    },
  );
  if (tokenResponse.status !== 200) {
    throw new CAPPError({
      title: 'Failed to get token from Lightcast',
      detail:
        'Ensure the LIGHTCAST_CLIENT_ID and LIGHTCAST_CLIENT_SECRET environment variables are set',
    });
  }
  const tokenResponseJson =
    (await tokenResponse.json()) as LightcastTokenResponse;
  /**
   * Filters for only Specialized Skills (S1) described as:
   * Skills that are primarily required within a subset of occupations or equip one to perform a specific task.
   * Also known as technical skills or hard skills excluding Common Skills (S2)
   */
  //
  const queryParams = 'typeIds=ST1&fields=id,name,category';
  const apiVersion = 9.4;
  const getSkillsResponse = await fetch(
    `https://emsiservices.com/skills/versions/${apiVersion}/skills?${queryParams}`,
    {
      headers: new Headers({
        Authorization: `Bearer ${tokenResponseJson.access_token}`,
      }),
    },
  );
  const getSkillsResponseJson =
    (await getSkillsResponse.json()) as LightcastSkillsResponse;
  /**
   * With version 9.4 in Lightcast API:
   * "Information Technology" category ID is 17
   * "Design" category is 17
   */
  const ITSkills = getSkillsResponseJson.data.filter(
    (skill) => skill.category.id === 17 || skill.category.id === 7,
  );
  return ITSkills;
};

const insertSkillsIntoDatabase = async (skills: Array<LightcastSkill>) => {
  // eslint-disable-next-line no-console
  console.log(`Preparing ${skills.length} skills to insert`);
  const dataAsSqlArr = skills.map(
    (skill) => Prisma.sql`(${Prisma.join([skill.id, skill.name])})`,
  );
  const insertedCount = await prisma.$executeRaw`
    INSERT INTO "ReferenceSkills" ("referenceId", name)
    VALUES ${Prisma.join(dataAsSqlArr)}
    ON CONFLICT ("referenceId") DO UPDATE SET
      name = EXCLUDED.name;`;
  // eslint-disable-next-line no-console
  console.log(`Inserted ${insertedCount} into database`);
};

const syncLightcastSkills = async () => {
  const skills = await getLightcastSkills();
  await insertSkillsIntoDatabase(skills);
};

(async () => {
  await syncLightcastSkills();
})().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
});
