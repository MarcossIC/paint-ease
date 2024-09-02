import { fixupConfigRules, fixupPluginRules } from '@eslint/compat';
import prettier from 'eslint-plugin-prettier';
import globals from 'globals';
import path from 'path';
import { fileURLToPath } from 'url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  {
    ignores: [
      '**/.vscode',
      '**/dist',
      '**/node_modules',
      '.github',
      'vite.config.mjs',
      'postcss.config.mjs',
      'tailwind.config.mjs',
      'setup-husky.js',
      'package.json',
      'public',
      'git-push.sh',
    ],
  },
  ...fixupConfigRules(
    compat.extends(
      'airbnb-base',
      'eslint:recommended',
      'plugin:prettier/recommended',
      'eslint-config-prettier'
    )
  ),
  {
    plugins: {
      prettier: fixupPluginRules(prettier),
    },
    //  languageOptions.parser  import/no-named-as-default-member
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },

    settings: {
      'import/resolver': {
        node: {
          extensions: ['.js'],
          paths: ['src'],
        },
      },
    },

    rules: {
      'no-unused-vars': [
        'error',
        {
          vars: 'local',
          varsIgnorePattern: '^_',
          args: 'none',
          argsIgnorePattern: '[iI]gnored',
          caughtErrors: 'all',
          destructuredArrayIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      'prettier/prettier': 'error',
      'no-underscore-dangle': 'off',
      'no-console': 'off',
      'no-plusplus': 'off',
      'import/no-extraneous-dependencies': 'off',
      'import/no-named-as-default': 'off',
      'import/no-named-as-default-member': 'off',
      'class-methods-use-this': ['error', { enforceForClassFields: false }],
      'no-param-reassign': [
        'error',
        {
          props: false,
        },
      ],
      'no-undef': [
        'warn',
        {
          typeof: false,
        },
      ],
    },
  },
];
