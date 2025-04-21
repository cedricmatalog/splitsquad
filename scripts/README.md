# Scripts Directory

This directory contains utility scripts for the SplitSquad application.

## Supabase Database Seeding

The `seed-supabase.js` script is used to seed the Supabase database with mock data from the `src/data` directory. This is useful for setting up a development or testing environment with realistic data.

### Prerequisites

1. A Supabase project already set up with the required tables (see `supabase/migrations/20230501000000_initial_schema.sql`)
2. Environment variables configured

### Environment Variables

Create a `.env` file in the root of the project with the following variables:

```env
# Supabase URL and keys
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

You can find these keys in your Supabase project dashboard under Project Settings > API.

### Running the Script

To run the seeding script:

```bash
npm run seed:supabase
```

### What the Script Does

1. Creates user accounts in Supabase Auth with the email/password from the mock data
2. Inserts user profiles, groups, expenses, and other related data into your Supabase tables
3. Maps the original IDs from the mock data to the new UUIDs in Supabase
4. Maintains all relationships between entities

### Troubleshooting

- If you encounter errors about duplicate emails, it means those users already exist in your database
- To reset the database before seeding, you can use the Supabase dashboard to truncate tables
- All users are created with the password `password123` for testing purposes

#### Fixing Schema Issues

If you encounter schema errors like `column users.auth_id does not exist`, you may need to fix your database schema:

1. Navigate to the SQL Editor in your Supabase dashboard
2. Run the SQL script provided in `scripts/fix-schema.sql`
3. This script will:
   - Check if the required tables exist
   - Add the `auth_id` column to the users table if it's missing
   - Ensure email columns have the proper unique constraints

Alternatively, you can run the entire migration script from `supabase/migrations/20230501000000_initial_schema.sql` to set up the schema from scratch.

#### Using the Modified Schema

If you're continuing to have issues with the original schema, you can use the modified version:

1. Navigate to the SQL Editor in your Supabase dashboard
2. Run the SQL script provided in `supabase/migrations/20230501000000_initial_schema_modified.sql`

This modified schema:

- Checks if the auth schema exists before creating tables
- Creates tables with or without auth references based on the environment
- Sets up RLS policies conditionally

#### Using the Modified Seed Script

If you're encountering issues with the original seed script, you can use the modified version:

```bash
npm run seed:supabase:modified
```

The modified seed script:

- Automatically checks if the auth schema exists
- Handles auth/non-auth environments gracefully
- Provides more detailed error handling
- Skips auth user creation when auth schema is missing

## Migrating to Supabase

The `migrate-to-supabase.js` script helps you transition the application from using local mock data to using Supabase as the data source.

### Running the Script

To run the migration script:

```bash
npm run migrate:supabase
```

### What the Script Does

1. Creates service files for each entity (users, groups, expenses, etc.) in the `src/services` directory
2. Creates an auth service file if it doesn't already exist
3. Generates a Supabase-compatible version of the AppContext as a reference file

### Next Steps After Running the Migration Script

1. Review and customize the service files in `src/services` directory
2. Update the conversion functions in each service file to properly map between database and app formats
3. Use the `AppContext.tsx.supabase-example` file as a reference to update your application
4. Update components to handle loading states and asynchronous data fetching

### Notes

- This script is for development purposes only
- In a production environment, you would use a more secure method for managing user passwords
- Make sure your Supabase service role key is kept secure and not committed to version control
