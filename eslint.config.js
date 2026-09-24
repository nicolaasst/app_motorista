import js from '@eslint/js';
import globals from 'globals';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';

// Diretórios "legado": código pré-existente ao início da refatoração
// (Fase 6 migra tela por tela; cada arquivo sai desta lista quando migrado
// para features/<dominio>/pages e passa a cumprir as regras estritas).
// Ver docs/DECISIONS.md (ADR-003) para o racional de adoção incremental.
const legacyGlobs = [
  'src/pages/**/*.jsx',
  'src/lib/**/*.jsx',
  'src/context/**/*.jsx',
  'src/api/**/*.js',
];

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'server/**', 'coverage/**', 'tests/visual/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.es2022 },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
    },
    settings: { react: { version: '18.3' } },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactPlugin.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      'react-hooks/exhaustive-deps': 'error',
      'react/prop-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // Padrão do design system usa <label> "cartão" com texto real a 3+
      // níveis de profundidade (ícone + título + descrição dentro de divs
      // aninhadas) — acessível de verdade para leitor de tela, mas além do
      // depth padrão de 2 da regra, que gerava falso positivo.
      'jsx-a11y/label-has-associated-control': ['error', { depth: 4 }],
    },
  },
  {
    // Adoção incremental: regras de a11y/hooks ainda não aplicadas ao código
    // legado não migrado. Rebaixadas para warn aqui; tornam-se erro de novo
    // assim que o arquivo for migrado na Fase 6 (e sair deste glob).
    files: legacyGlobs,
    rules: {
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',
      'jsx-a11y/anchor-is-valid': 'warn',
      'jsx-a11y/label-has-associated-control': 'warn',
      'jsx-a11y/no-autofocus': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  {
    files: ['**/*.test.{js,jsx,ts,tsx}', 'tests/**/*'],
    languageOptions: { globals: { ...globals.node, ...globals.browser, vi: 'readonly' } },
  },
  {
    files: ['*.config.{js,ts}', 'scripts/**/*.mjs'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
  prettierConfig,
);
