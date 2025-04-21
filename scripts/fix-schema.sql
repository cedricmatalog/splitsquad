-- SQL script to check and fix schema issues in the Supabase project

-- First, let's check if we're running with appropriate permissions
DO $$
BEGIN
  RAISE NOTICE 'Running schema check with current role: %', current_user;
END
$$;

-- Check if exec_sql function is available (used by our JS script)
CREATE OR REPLACE FUNCTION create_exec_sql_if_missing()
RETURNS text AS $$
DECLARE
  func_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'exec_sql' 
  ) INTO func_exists;
  
  IF NOT func_exists THEN
    -- Create a simple exec_sql function that can run arbitrary SQL
    -- Note: This is potentially dangerous in production, only use for setup
    EXECUTE 'CREATE OR REPLACE FUNCTION exec_sql(sql text) RETURNS void AS $inner$
      BEGIN
        EXECUTE sql;
      END;
      $inner$ LANGUAGE plpgsql SECURITY DEFINER;';
    RETURN 'Created exec_sql function';
  ELSE
    RETURN 'exec_sql function already exists';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RETURN 'Failed to create exec_sql function: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;

SELECT create_exec_sql_if_missing() as exec_sql_status;

-- Create a function to check if a column exists
CREATE OR REPLACE FUNCTION check_column_exists(table_name text, column_name text) 
RETURNS boolean AS $$
DECLARE
  column_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = $1 
    AND column_name = $2
  ) INTO column_exists;
  
  RETURN column_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if a table exists
CREATE OR REPLACE FUNCTION check_table_exists(table_name text) 
RETURNS boolean AS $$
DECLARE
  table_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_name = $1
  ) INTO table_exists;
  
  RETURN table_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Show all tables in public schema
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- First check if the users table exists
DO $$
DECLARE
  table_exists boolean;
BEGIN
  SELECT check_table_exists('users') INTO table_exists;
  
  IF NOT table_exists THEN
    RAISE NOTICE 'Creating users table...';
    CREATE TABLE users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      avatar_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    RAISE NOTICE 'Created users table';
  ELSE
    RAISE NOTICE 'users table already exists';
  END IF;
END
$$;

-- Check if auth schema is available
DO $$
DECLARE
  schema_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.schemata
    WHERE schema_name = 'auth'
  ) INTO schema_exists;
  
  IF schema_exists THEN
    RAISE NOTICE 'auth schema exists';
  ELSE
    RAISE NOTICE 'auth schema does not exist - creating auth_id with no foreign key';
  END IF;
END
$$;

-- Function to check if auth_id column exists in users table and add it if it doesn't
CREATE OR REPLACE FUNCTION ensure_auth_id_column() 
RETURNS text AS $$
DECLARE
  column_exists boolean;
  auth_schema_exists boolean;
BEGIN
  SELECT check_column_exists('users', 'auth_id') INTO column_exists;
  
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.schemata
    WHERE schema_name = 'auth'
  ) INTO auth_schema_exists;
  
  IF NOT column_exists THEN
    IF auth_schema_exists THEN
      -- If auth schema exists, add foreign key
      BEGIN
        ALTER TABLE users ADD COLUMN auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;
        RETURN 'Added auth_id column to users table with foreign key';
      EXCEPTION WHEN OTHERS THEN
        -- If adding with foreign key fails, try without
        RAISE NOTICE 'Failed to add auth_id with foreign key: %', SQLERRM;
        ALTER TABLE users ADD COLUMN auth_id UUID UNIQUE;
        RETURN 'Added auth_id column to users table without foreign key';
      END;
    ELSE
      -- If auth schema doesn't exist, add without foreign key
      ALTER TABLE users ADD COLUMN auth_id UUID UNIQUE;
      RETURN 'Added auth_id column to users table without foreign key (no auth schema)';
    END IF;
  ELSE
    RETURN 'auth_id column already exists in users table';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute the function to ensure auth_id column exists
SELECT ensure_auth_id_column() as auth_id_status;

-- Check users table columns
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Check if groups table exists and create if missing
DO $$
DECLARE
  table_exists boolean;
BEGIN
  SELECT check_table_exists('groups') INTO table_exists;
  
  IF NOT table_exists THEN
    RAISE NOTICE 'Creating groups table...';
    CREATE TABLE groups (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name TEXT NOT NULL,
      description TEXT,
      created_by UUID REFERENCES users(id) NOT NULL,
      date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    RAISE NOTICE 'Created groups table';
  ELSE
    RAISE NOTICE 'groups table already exists';
  END IF;
END
$$;

-- Check if group_members table exists and create if missing
DO $$
DECLARE
  table_exists boolean;
BEGIN
  SELECT check_table_exists('group_members') INTO table_exists;
  
  IF NOT table_exists THEN
    RAISE NOTICE 'Creating group_members table...';
    CREATE TABLE group_members (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(group_id, user_id)
    );
    RAISE NOTICE 'Created group_members table';
  ELSE
    RAISE NOTICE 'group_members table already exists';
  END IF;
END
$$;

-- Check if expenses table exists and create if missing
DO $$
DECLARE
  table_exists boolean;
BEGIN
  SELECT check_table_exists('expenses') INTO table_exists;
  
  IF NOT table_exists THEN
    RAISE NOTICE 'Creating expenses table...';
    CREATE TABLE expenses (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
      description TEXT NOT NULL,
      amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
      paid_by UUID REFERENCES users(id) NOT NULL,
      date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    RAISE NOTICE 'Created expenses table';
  ELSE
    RAISE NOTICE 'expenses table already exists';
  END IF;
END
$$;

-- Check if expense_participants table exists and create if missing
DO $$
DECLARE
  table_exists boolean;
BEGIN
  SELECT check_table_exists('expense_participants') INTO table_exists;
  
  IF NOT table_exists THEN
    RAISE NOTICE 'Creating expense_participants table...';
    CREATE TABLE expense_participants (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE NOT NULL,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
      share DECIMAL(10,2) NOT NULL CHECK (share >= 0),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(expense_id, user_id)
    );
    RAISE NOTICE 'Created expense_participants table';
  ELSE
    RAISE NOTICE 'expense_participants table already exists';
  END IF;
END
$$;

-- Check if payments table exists and create if missing
DO $$
DECLARE
  table_exists boolean;
BEGIN
  SELECT check_table_exists('payments') INTO table_exists;
  
  IF NOT table_exists THEN
    RAISE NOTICE 'Creating payments table...';
    CREATE TABLE payments (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
      from_user UUID REFERENCES users(id) NOT NULL,
      to_user UUID REFERENCES users(id) NOT NULL,
      amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
      date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      payment_method TEXT DEFAULT 'cash',
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CHECK (from_user <> to_user)
    );
    RAISE NOTICE 'Created payments table';
  ELSE
    RAISE NOTICE 'payments table already exists';
  END IF;
END
$$;

-- Verify all tables exist
SELECT 
  check_table_exists('users') as users_exists,
  check_table_exists('groups') as groups_exists,
  check_table_exists('group_members') as group_members_exists,
  check_table_exists('expenses') as expenses_exists,
  check_table_exists('expense_participants') as expense_participants_exists,
  check_table_exists('payments') as payments_exists;

-- Check if Extension UUID is enabled
DO $$
DECLARE
  extension_enabled boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp'
  ) INTO extension_enabled;
  
  IF NOT extension_enabled THEN
    RAISE NOTICE 'Enabling UUID extension...';
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    RAISE NOTICE 'UUID extension enabled';
  ELSE
    RAISE NOTICE 'UUID extension already enabled';
  END IF;
END
$$;

-- Add unique constraint to email if missing
DO $$
DECLARE
  email_is_unique boolean;
BEGIN
  SELECT COUNT(*) > 0 INTO email_is_unique
  FROM information_schema.table_constraints tc
  JOIN information_schema.constraint_column_usage ccu 
    ON tc.constraint_name = ccu.constraint_name
  WHERE tc.constraint_type = 'UNIQUE'
    AND tc.table_name = 'users'
    AND ccu.column_name = 'email';
    
  IF NOT email_is_unique THEN
    BEGIN
      ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);
      RAISE NOTICE 'Added UNIQUE constraint to users.email';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not add UNIQUE constraint to users.email: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'UNIQUE constraint already exists for users.email';
  END IF;
END 
$$; 