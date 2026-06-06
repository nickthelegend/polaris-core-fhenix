module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/lib', '<rootDir>/app', '<rootDir>/hooks', '<rootDir>/__tests__'],
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/tests/'],
  testMatch: ['**/*.test.ts', '**/*.property.test.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testTimeout: 60000,
};
