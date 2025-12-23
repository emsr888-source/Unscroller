import type { Config } from 'jest';

const config: Config = {
  rootDir: '.',
  moduleFileExtensions: ['js', 'json', 'ts'],
  testMatch: ['<rootDir>/src/**/*.(spec|test).ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },
  testEnvironment: 'node',
  setupFilesAfterEnv: [],
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/dist/'],
  collectCoverageFrom: ['<rootDir>/src/**/*.(t|j)s'],
  coverageDirectory: '<rootDir>/coverage',
};

export default config;
