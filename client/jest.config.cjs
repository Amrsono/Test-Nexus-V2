module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': '<rootDir>/src/__mocks__/styleMock.js',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2)$': '<rootDir>/src/__mocks__/fileMock.js',
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
};
