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

const skillsAnnotationDummy = [
  {
    name: 'Typescript',
    canonical: 'TypeScript',
    suggest: true,
    rejectAs: null,
  },
  {
    name: 'JAVAScript',
    canonical: null,
    suggest: null,
    rejectAs: null,
  },
  {
    name: 'python',
    canonical: null,
    suggest: true,
    rejectAs: null,
  },
];

const referenceSkillsDummyDuplicateId = [
  {
    name: 'TypeScript (TS)',
    referenceId: 'ET3B93055220D592C8',
  },
];

export {
  referenceSkillsDummy,
  referenceSkillsDummyDuplicateId,
  skillsAnnotationDummy,
};
