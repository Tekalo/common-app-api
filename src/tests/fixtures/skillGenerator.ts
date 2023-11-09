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

const seedSkillsUpload = async () => {
  const { data } = skills;
  await prisma.skill.createMany({
    data,
  });
};

const seedSkillsDelete = async () => {
  await prisma.skill.deleteMany();
};

export { seedSkillsUpload, seedSkillsDelete };
