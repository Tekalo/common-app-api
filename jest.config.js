export default {
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '@capp/(.*)$': `<rootDir>/packages/$1`, // map imported @capp/* modules with the actual source code
  },
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest', // loads .swcrc config by default
  },
};
