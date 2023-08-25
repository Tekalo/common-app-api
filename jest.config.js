export default {
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest', // loads .swcrc config by default
  },
  openHandlesTimeout: 2 * 1000,
};
