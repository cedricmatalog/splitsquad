-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table without foreign key reference
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create groups table
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES users(id) NOT NULL,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create group_members table
CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  paid_by UUID REFERENCES users(id) NOT NULL,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create expense_participants table
CREATE TABLE IF NOT EXISTS expense_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  share DECIMAL(10,2) NOT NULL CHECK (share >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(expense_id, user_id)
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_group_id ON expenses(group_id);
CREATE INDEX IF NOT EXISTS idx_expenses_paid_by ON expenses(paid_by);
CREATE INDEX IF NOT EXISTS idx_expense_participants_expense_id ON expense_participants(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_participants_user_id ON expense_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_group_id ON payments(group_id);
CREATE INDEX IF NOT EXISTS idx_payments_from_user ON payments(from_user);
CREATE INDEX IF NOT EXISTS idx_payments_to_user ON payments(to_user);

-- Create views for balance calculations
CREATE OR REPLACE VIEW group_balances AS
WITH expense_totals AS (
  -- Calculate what each user paid for the group
  SELECT 
    e.group_id,
    e.paid_by AS user_id,
    SUM(e.amount) AS paid_amount
  FROM expenses e
  GROUP BY e.group_id, e.paid_by
),
participant_shares AS (
  -- Calculate what each user owes in each group
  SELECT 
    e.group_id,
    ep.user_id,
    SUM(ep.share) AS share_amount
  FROM expense_participants ep
  JOIN expenses e ON ep.expense_id = e.id
  GROUP BY e.group_id, ep.user_id
),
payment_outflows AS (
  -- Payments made by users
  SELECT 
    group_id,
    from_user AS user_id,
    SUM(amount) AS outflow_amount
  FROM payments
  GROUP BY group_id, from_user
),
payment_inflows AS (
  -- Payments received by users
  SELECT 
    group_id,
    to_user AS user_id,
    SUM(amount) AS inflow_amount
  FROM payments
  GROUP BY group_id, to_user
)
SELECT 
  COALESCE(et.group_id, ps.group_id, po.group_id, pi.group_id) AS group_id,
  COALESCE(et.user_id, ps.user_id, po.user_id, pi.user_id) AS user_id,
  (COALESCE(et.paid_amount, 0) - COALESCE(ps.share_amount, 0) + 
   COALESCE(pi.inflow_amount, 0) - COALESCE(po.outflow_amount, 0)) AS balance
FROM expense_totals et
FULL OUTER JOIN participant_shares ps 
  ON et.group_id = ps.group_id AND et.user_id = ps.user_id
FULL OUTER JOIN payment_outflows po 
  ON COALESCE(et.group_id, ps.group_id) = po.group_id 
  AND COALESCE(et.user_id, ps.user_id) = po.user_id
FULL OUTER JOIN payment_inflows pi 
  ON COALESCE(et.group_id, ps.group_id, po.group_id) = pi.group_id 
  AND COALESCE(et.user_id, ps.user_id, po.user_id) = pi.user_id;

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create basic policies without auth dependencies
DROP POLICY IF EXISTS "Public access to users" ON users;
CREATE POLICY "Public access to users" 
  ON users FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to groups" ON groups;
CREATE POLICY "Public access to groups" 
  ON groups FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to group_members" ON group_members;
CREATE POLICY "Public access to group_members" 
  ON group_members FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to expenses" ON expenses;
CREATE POLICY "Public access to expenses" 
  ON expenses FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to expense_participants" ON expense_participants;
CREATE POLICY "Public access to expense_participants" 
  ON expense_participants FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to payments" ON payments;
CREATE POLICY "Public access to payments" 
  ON payments FOR ALL
  USING (true)
  WITH CHECK (true); 