import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  testEnvironment: 'node',
  collectCoverage: true,
  maxWorkers: '50%',
  transform: {
    '^.+\\.(t|j)sx?$': '@swc-node/jest',
  },
  collectCoverageFrom: ['<rootDir>/src/**/*.ts'],
};

export default config;
