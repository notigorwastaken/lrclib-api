module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  clearMocks: true,
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/index.ts",
    "!src/types/**",
    "!src/errors/index.ts",
  ],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
