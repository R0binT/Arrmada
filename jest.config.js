module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  testPathIgnorePatterns: ["/node_modules/", "<rootDir>/\\.worktrees/"],
  modulePathIgnorePatterns: ["<rootDir>/\\.worktrees/"],
  watchPathIgnorePatterns: ["<rootDir>/\\.worktrees/"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};
