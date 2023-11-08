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
  await Promise.all(
    skills.data.map((skill) => prisma.skill.create({ data: skill })),
  );
};

export default seedSkillsUpload;
