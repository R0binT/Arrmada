const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: [
      'dist/*',
      'web-build/*',
      '.expo/*',
      'node_modules/*',
      'docs/script.js',
      'coverage/*',
    ],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    rules: {
      // Intentional RN / mount-refresh patterns; React Compiler rules are too noisy here.
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    files: [
      '**/jest.setup.js',
      '**/__tests__/**',
      '**/*.test.ts',
      '**/*.test.tsx',
    ],
    languageOptions: {
      globals: {
        jest: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
      },
    },
  },
]);
