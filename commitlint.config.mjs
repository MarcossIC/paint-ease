/*
Disclaimer: If you have problems with "npx" you can change it in the .husky/commit-msg file
Default requirements:
  * feat: A new feature
  * fix: A bug fix
  * docs: Documentation only changes
  * style: Changes that do not affect the meaning of the code (whitespace, formatting, missing semicolons, etc.)
  * refactor: A code change that does not fix a bug or add a feature
  * test: Add missing tests or correct existing tests
  * perf: A code change that improves performance
  * build: Changes that affect the build system or external dependencies
  * ci: Changes to our CI configuration files and scripts
  * revert: Reverts a previous commit
- The scope is optional. The scope is the message that goes in parentheses after the type and before the subject.
- The subject is the description of the changes that were made in the commit.
- The subject must begin in lowercase.
- The subject cannot end with dot(.).
- Message must be less than 100 characters.

Bad Examples:
- "some: invalid commit type"
- "fix: Start with upper case"
- "feat: subject end with dot."
*/
export default {
  extends: ['@commitlint/config-conventional'],
  'type-enum': [
    2,
    'always',
    [
      'feat',
      'fix',
      'docs',
      'style',
      'refactor',
      'test',
      'perf',
      'build',
      'ci',
      'revert',
      'deps',
    ],
  ],
};
