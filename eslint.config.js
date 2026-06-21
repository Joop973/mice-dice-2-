// ESLint (Flat Config). Pragmatisch gehalten: empfohlene JS-/TypeScript-Regeln
// plus React-Hooks-Prüfung. Bewusst OHNE typgeprüfte Regeln (kein TypeChecker im
// Lint-Lauf), damit `npm run lint` schnell bleibt und tsc die Typprüfung übernimmt.
//
// eslint-config-prettier steht am Ende und schaltet alle rein stilistischen
// Regeln aus, die mit Prettier kollidieren würden (Prettier formatiert, ESLint
// findet Fehler).

import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: ['dist', 'dev-dist', 'coverage', 'playwright-report', 'test-results'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}', 'server/**/*.ts', 'scripts/**/*.{ts,mts,mjs}', 'e2e/**/*.ts'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // Ungenutzte Variablen sind Fehler, führende Unterstriche sind absichtlich erlaubt.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  prettier
);
