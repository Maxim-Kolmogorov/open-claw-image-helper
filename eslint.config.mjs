import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['.output/**', '**/*.mjs', '**/*.js'] },
  js.configs.recommended,
  {
    files: ['**/*.ts'],
    extends: [tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        process: 'readonly'
      }
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports' }
      ],
      semi: ['error', 'never'],
      'space-before-function-paren': ['error', {
        anonymous: 'never',
        named: 'never',
        asyncArrow: 'always'
      }],
      'lines-between-class-members': [
        'error',
        'always',
        { exceptAfterSingleLine: true }
      ],
      'array-bracket-spacing': ['error', 'never'],
      'object-curly-spacing': ['error', 'always'],
      'object-curly-newline': ['error', {
        ImportDeclaration: 'never',
        ExportDeclaration: 'never'
      }],
      'no-multiple-empty-lines': ['error', { max: 1 }],
      'max-lines': ['error', {
        max: 1000,
        skipComments: false,
        skipBlankLines: false
      }],
      'max-len': ['error', {
        code: 100,
        ignoreUrls: true,
        tabWidth: 2,
        ignoreTrailingComments: true,
        ignoreStrings: true,
        ignoreRegExpLiterals: true
      }],
      quotes: ['error', 'single'],
      'keyword-spacing': ['error', { after: true }],
      'prefer-rest-params': 'off',
      'prefer-promise-reject-errors': 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off'
    }
  }
)
