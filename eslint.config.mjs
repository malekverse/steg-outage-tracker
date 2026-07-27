import js from '@eslint/js'
import nextPlugin from '@next/eslint-plugin-next'
import tsEslint from 'typescript-eslint'

export default tsEslint.config(
  js.configs.recommended,
  ...tsEslint.configs.recommended,
  {
    plugins: { '@next/next': nextPlugin },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
    },
  },
  {
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'prefer-const': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    ignores: ['.next/', 'node_modules/', 'public/sw.js'],
  },
)
