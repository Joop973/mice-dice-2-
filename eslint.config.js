// ESLint Flat Config. Bewusst schlank: empfohlene JS-/TS-Regeln + React-Hooks,
// Prettier-kompatibel (Formatierung macht Prettier, ESLint nur Korrektheit).

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: ['dist/**', 'public/**', 'node_modules/**', '*.config.js', 'scripts/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Engine/Tests nutzen bewusst leere catch-Blöcke etc.; pragmatisch halten.
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
  prettier
);
