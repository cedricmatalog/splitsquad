This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Code Quality and Git Hooks

This project uses Husky to enforce code quality standards through Git hooks. These hooks automatically run on specific Git events to ensure code consistency and prevent issues.

See [GIT_HOOKS.md](./GIT_HOOKS.md) for detailed information about:

- The pre-commit hook (linting, formatting, and running tests for changed files)
- The commit-msg hook (conventional commit messages)
- The pre-push hook (type checking, running all tests, and building the application)
- How to run code quality checks manually

This ensures that code quality is maintained throughout the development process, and tests pass before code is committed or pushed.

## Supabase Integration

This project can be configured to use [Supabase](https://supabase.com) as a backend. The application comes with scripts to help you migrate from the mock data to a fully functional Supabase backend.

### Setting Up Supabase

1. Create a Supabase project from the [Supabase Dashboard](https://supabase.com)
2. Run the SQL migration script found in `supabase/migrations/20230501000000_initial_schema.sql`
3. Set up your environment variables in `.env.local` (see `.env.example` for required variables)

### Database Schema Options

We provide multiple schema options depending on your needs:

#### Option 1: Auth-integrated Schema (Default)

The default schema in `supabase/migrations/20230501000000_initial_schema.sql` integrates with Supabase Auth.

#### Option 2: Simplified Schema (No Auth Dependencies)

If you're encountering issues with the auth_id column or don't need authentication, use our simplified schema:

1. Navigate to the SQL Editor in your Supabase dashboard
2. Copy and paste the SQL from the comments below
3. This creates tables without auth dependencies and sets up basic public policies

```sql
-- Copy this SQL to your Supabase SQL Editor
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table without auth dependencies
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create other tables (groups, expenses, etc.)
-- ...
-- (Full SQL available in the repository)
```

The complete simplified schema is available in the SQL Editor comments. This approach removes authentication dependencies while maintaining all application functionality.

### Seeding Your Supabase Database

We provide multiple seeding scripts to match your schema choice:

```bash
# For the default auth-integrated schema
npm run seed:supabase

# For the modified auth-aware schema that handles missing auth schema
npm run seed:supabase:modified

# For the simplified schema without auth dependencies
npm run seed:supabase:simplified
```

The simplified seeding script:

- Does not attempt to create auth users
- Does not require the auth schema to exist
- Works with the basic schema above
- Maintains all application functionality

For more details, see the [scripts README](./scripts/README.md).

### Migrating Your Application to Supabase

To generate service files for interacting with Supabase:

```bash
npm run migrate:supabase
```

This creates:

- API service files for each entity
- An auth service for handling user authentication
- A reference AppContext implementation

After running this script, you'll need to update your application to use these new service files instead of the mock data.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
