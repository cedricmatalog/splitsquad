# Git Hooks & Contribution Guidelines

This project uses [Husky](https://typicode.github.io/husky/) to enforce code quality and maintain consistent commit messages. These git hooks run automatically during your development workflow.

## Installed Hooks

### pre-commit

This hook runs before you commit changes and performs the following checks:

- Lints your code with ESLint
- Formats your code with Prettier
- Runs tests related to modified files

Only files that are staged for commit will be processed. Tests only run for files that have related test files, and will pass silently if no test files are found.

### commit-msg

This hook validates your commit messages to ensure they follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

Commit messages should be structured as follows:

```
<type>(<optional scope>): <description>

<optional body>

<optional footer>
```

Common types include:

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools

Examples:

```
feat(dashboard): add user balance card
fix: correct date formatting in expense list
docs: add API documentation
```

### pre-push

This hook runs before you push changes to the remote repository and performs:

- TypeScript type checking
- Running all tests to ensure they pass
- Building the application to ensure it compiles successfully

This helps prevent pushing code that breaks the test suite, has type errors, or fails to build correctly.

## Bypassing Hooks

In rare cases where you need to bypass the hooks (not recommended), you can use:

```bash
git commit --no-verify -m "commit message"
git push --no-verify
```

## Setting Up Git Hooks (For New Developers)

The hooks should be set up automatically when you run `npm install`. If for some reason they aren't, run:

```bash
npm run prepare
```

## Manual Code Quality Checks

You can manually run all checks with:

```bash
npm run check-all
```

Or run them individually:

```bash
npm run lint        # Run ESLint
npm run typecheck   # Run TypeScript type check
npm run test        # Run tests
npm run build       # Build the application
```
