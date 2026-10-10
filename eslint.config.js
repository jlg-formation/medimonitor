import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'playwright-report', 'test-results'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: { ecmaVersion: 2022, globals: globals.browser },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['src/domain/**/*.ts'],
    rules: {
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'random', message: 'Utiliser le PRNG seedé (domain/rng.ts).' },
        { object: 'Date', property: 'now', message: 'Le domaine ne lit jamais l\'horloge réelle.' },
      ],
    },
  },
);
