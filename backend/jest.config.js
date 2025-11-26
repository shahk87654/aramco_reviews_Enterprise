module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@common/(.*)$': '<rootDir>/common/$1',
    '^@auth/(.*)$': '<rootDir>/auth/$1',
    '^@reviews/(.*)$': '<rootDir>/reviews/$1',
    '^@stations/(.*)$': '<rootDir>/stations/$1',
    '^@analytics/(.*)$': '<rootDir>/analytics/$1',
    '^@alerts/(.*)$': '<rootDir>/alerts/$1',
    '^@database/(.*)$': '<rootDir>/database/$1',
    '^@config/(.*)$': '<rootDir>/config/$1',
  },
};
