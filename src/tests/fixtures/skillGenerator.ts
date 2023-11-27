import { prisma } from '@App/resources/client.js';

const skills = {
  data: [
    {
      name: 'Python',
    },
    {
      name: 'JS',
    },
    {
      name: 'type3script',
    },
    {
      name: 'horse training',
    },
  ],
};

const referenceSkillsDummy = [
  {
    name: 'TypeScript',
    referenceId: 'ET3B93055220D592C8',
  },
  {
    name: 'JavaScript',
    referenceId: 'ET3B93055220D592C9',
  },
  {
    name: 'Python',
    referenceId: 'ET3B93055220D592C10',
  },
];

const referenceSkillsDummyDuplicateId = [
  {
    name: 'TypeScript (TS)',
    referenceId: 'ET3B93055220D592C8',
  },
];

const seedSkillsUpload = async () => {
  const { data } = skills;
  await prisma.skill.createMany({
    data,
  });
};

const seedSkillsDelete = async () => {
  await prisma.skill.deleteMany();
};

export {
  seedSkillsUpload,
  seedSkillsDelete,
  referenceSkillsDummy,
  referenceSkillsDummyDuplicateId,
};
