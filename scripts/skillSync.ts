import { PrismaClient } from '@prisma/client';
import CAPPError from '../src/resources/shared/CAPPError.js';
import SkillController from '../src/controllers/SkillController.js';

// Number of skills to insert into DB at once
const chunkSize = 500;

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
  infoUrl: string;
  name: string;
  type: {
    id: string;
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
  // Returns all Specialized Skills (S1) excluding Common Skills (S2)
  const queryParams = 'typeIds=ST1';
  const getSkillsResponse = await fetch(
    `https://emsiservices.com/skills/versions/latest/skills?${queryParams}`,
    {
      headers: new Headers({
        Authorization: `Bearer ${tokenResponseJson.access_token}`,
      }),
    },
  );
  const getSkillsResponseJson =
    (await getSkillsResponse.json()) as LightcastSkillsResponse;
  return getSkillsResponseJson.data;
};

const insertSkillsIntoDatabase = async (skills: Array<LightcastSkill>) => {
  const skillsController = new SkillController(prisma);
  const promises = [];
  for (let i = 0; i < skills.length; i += chunkSize) {
    const chunk = skills.slice(i, i + chunkSize);
    const skillsPayload = chunk.map((skill) => ({
      name: skill.name,
      referenceId: skill.id,
    }));
    const createReferenceSkillPromise =
      skillsController.createReferenceSkills(skillsPayload);
    promises.push(createReferenceSkillPromise);
  }
  await Promise.all(promises);
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
