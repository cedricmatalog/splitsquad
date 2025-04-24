# Code Quality Requirements

This project enforces strict code quality standards to ensure a reliable and maintainable codebase.

## Requirements

Before merging any code, the following checks must pass:

1. **ESLint** - All code must follow the project's linting rules with no warnings or errors
2. **Tests** - All tests must pass (currently 77 tests across 16 test suites)
3. **Build** - The application must build successfully without errors

## How to Verify

You can verify that your code meets all quality requirements by running:

```bash
npm run check-all
```

This command runs all checks in sequence:

- `npm run lint` - Checks the code for linting issues
- `npm run typecheck` - Verifies TypeScript types
- `npm run test` - Runs all tests to ensure they pass
- `npm run build` - Builds the application to ensure it compiles correctly

## Continuous Integration

A GitHub Actions workflow has been set up to run these checks automatically on every push and pull request to the main and develop branches. See the workflow configuration at `.github/workflows/ci.yml`.

## Pre-commit Hooks

Husky pre-commit hooks are configured to run linting and tests before allowing commits. This ensures that code quality is maintained throughout the development process.

To install the hooks, run:

```bash
npm install
```

The hooks are installed automatically during the post-install process.

## IDE Integration

For the best development experience, configure your IDE to:

1. Run ESLint on save
2. Format code using Prettier on save
3. Show TypeScript errors in real-time

This will help catch issues early in the development process before running the checks.
