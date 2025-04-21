require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase connection
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Path to data files
const dataDir = path.join(__dirname, '../src/data');

// Helper function to read JSON files
const readJsonFile = (filename) => {
  const filePath = path.join(dataDir, filename);
  const fileContent = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(fileContent);
};

// Maps to track old IDs to new UUIDs
const idMaps = {
  users: {},
  groups: {},
  expenses: {}
};

// Check database setup
async function checkDatabaseSetup() {
  console.log('🔍 Checking database setup...');
  
  try {
    // Check if users table exists
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error accessing users table:', error);
      console.error('Make sure the database schema is properly set up.');
      process.exit(1);
    }
    
    console.log('✅ Users table exists and is accessible');
    
    // Check if there are already users in the database
    if (data && data.length > 0) {
      console.log(`ℹ️ Users table already has ${data.length} user(s)`);
    }
  } catch (error) {
    console.error('❌ Error checking database setup:', error);
    console.error('Make sure the database schema is properly set up.');
    process.exit(1);
  }
}

// Seed users - simplified without auth
async function seedUsers() {
  console.log('\n🌱 Seeding users...');
  const users = readJsonFile('users.json');
  
  for (const user of users) {
    try {
      const { data: dbUser, error: dbError } = await supabase
        .from('users')
        .insert({
          name: user.name,
          email: user.email,
          avatar_url: user.avatar
        })
        .select()
        .single();
      
      if (dbError) {
        console.error(`Error creating user record for ${user.email}:`, dbError);
        continue;
      }
      
      // Map old ID to new UUID
      idMaps.users[user.id] = dbUser.id;
      console.log(`Added user ${user.name} with ID: ${dbUser.id}`);
    } catch (error) {
      console.error(`Error inserting user ${user.name}:`, error);
    }
  }
  
  console.log(`✅ Seeded ${Object.keys(idMaps.users).length} users`);
}

// Seed groups
async function seedGroups() {
  console.log('\n🌱 Seeding groups...');
  const groups = readJsonFile('groups.json');
  
  for (const group of groups) {
    const newCreatedBy = idMaps.users[group.createdBy];
    
    if (!newCreatedBy) {
      console.error(`User not found for group ${group.name} created by ${group.createdBy}`);
      continue;
    }

    try {
      const { data: dbGroup, error } = await supabase
        .from('groups')
        .insert({
          name: group.name,
          description: group.description,
          created_by: newCreatedBy,
          date: group.date
        })
        .select()
        .single();

      if (error) {
        console.error(`Error creating group ${group.name}:`, error);
        continue;
      }

      // Map old ID to new UUID
      idMaps.groups[group.id] = dbGroup.id;
      console.log(`Added group ${group.name} with ID: ${dbGroup.id}`);
    } catch (error) {
      console.error(`Error inserting group ${group.name}:`, error);
    }
  }
  
  console.log(`✅ Seeded ${Object.keys(idMaps.groups).length} groups`);
}

// Seed group members
async function seedGroupMembers() {
  console.log('\n🌱 Seeding group members...');
  const groupMembers = readJsonFile('groupMembers.json');
  const batchSize = 100;
  let insertCount = 0;
  
  // Process in batches
  for (let i = 0; i < groupMembers.length; i += batchSize) {
    const batch = groupMembers.slice(i, i + batchSize);
    const batchToInsert = [];
    
    for (const member of batch) {
      const newUserId = idMaps.users[member.userId];
      const newGroupId = idMaps.groups[member.groupId];
      
      if (!newUserId || !newGroupId) {
        console.error(`Missing mapping for group member: ${member.userId} -> ${member.groupId}`);
        continue;
      }
      
      batchToInsert.push({
        user_id: newUserId,
        group_id: newGroupId
      });
    }
    
    if (batchToInsert.length > 0) {
      try {
        const { error } = await supabase
          .from('group_members')
          .insert(batchToInsert);
        
        if (error) {
          console.error('Error inserting group members batch:', error);
          continue;
        }
        
        insertCount += batchToInsert.length;
      } catch (error) {
        console.error('Error during group members batch insert:', error);
      }
    }
  }
  
  console.log(`✅ Seeded ${insertCount} group members`);
}

// Seed expenses
async function seedExpenses() {
  console.log('\n🌱 Seeding expenses...');
  const expenses = readJsonFile('expenses.json');
  
  for (const expense of expenses) {
    const newGroupId = idMaps.groups[expense.groupId];
    const newPaidBy = idMaps.users[expense.paidBy];
    
    if (!newGroupId || !newPaidBy) {
      console.error(`Missing mapping for expense ${expense.id}`);
      continue;
    }
    
    try {
      const { data: dbExpense, error } = await supabase
        .from('expenses')
        .insert({
          group_id: newGroupId,
          description: expense.description,
          amount: expense.amount,
          paid_by: newPaidBy,
          date: expense.date
        })
        .select()
        .single();
      
      if (error) {
        console.error(`Error creating expense ${expense.description}:`, error);
        continue;
      }
      
      // Map old ID to new UUID
      idMaps.expenses[expense.id] = dbExpense.id;
      console.log(`Added expense ${expense.description} with ID: ${dbExpense.id}`);
    } catch (error) {
      console.error(`Error inserting expense ${expense.description}:`, error);
    }
  }
  
  console.log(`✅ Seeded ${Object.keys(idMaps.expenses).length} expenses`);
}

// Seed expense participants
async function seedExpenseParticipants() {
  console.log('\n🌱 Seeding expense participants...');
  const expenseParticipants = readJsonFile('expenseParticipants.json');
  const batchSize = 100;
  let insertCount = 0;
  
  // Process in batches
  for (let i = 0; i < expenseParticipants.length; i += batchSize) {
    const batch = expenseParticipants.slice(i, i + batchSize);
    const batchToInsert = [];
    
    for (const participant of batch) {
      const newExpenseId = idMaps.expenses[participant.expenseId];
      const newUserId = idMaps.users[participant.userId];
      
      if (!newExpenseId || !newUserId) {
        console.error(`Missing mapping for expense participant: ${participant.expenseId} -> ${participant.userId}`);
        continue;
      }
      
      batchToInsert.push({
        expense_id: newExpenseId,
        user_id: newUserId,
        share: participant.share
      });
    }
    
    if (batchToInsert.length > 0) {
      try {
        const { error } = await supabase
          .from('expense_participants')
          .insert(batchToInsert);
        
        if (error) {
          console.error('Error inserting expense participants batch:', error);
          continue;
        }
        
        insertCount += batchToInsert.length;
      } catch (error) {
        console.error('Error during expense participants batch insert:', error);
      }
    }
  }
  
  console.log(`✅ Seeded ${insertCount} expense participants`);
}

// Seed payments
async function seedPayments() {
  console.log('\n🌱 Seeding payments...');
  const payments = readJsonFile('payments.json');
  
  for (const payment of payments) {
    const newGroupId = idMaps.groups[payment.groupId];
    const newFromUser = idMaps.users[payment.fromUser];
    const newToUser = idMaps.users[payment.toUser];
    
    if (!newGroupId || !newFromUser || !newToUser) {
      console.error(`Missing mapping for payment ${payment.id}`);
      continue;
    }
    
    try {
      const { error } = await supabase
        .from('payments')
        .insert({
          group_id: newGroupId,
          from_user: newFromUser,
          to_user: newToUser,
          amount: payment.amount,
          date: payment.date
        });
      
      if (error) {
        console.error(`Error creating payment:`, error);
        continue;
      }
      
      console.log(`Added payment from ${payment.fromUser} to ${payment.toUser}`);
    } catch (error) {
      console.error(`Error inserting payment:`, error);
    }
  }
  
  console.log(`✅ Seeded payments`);
}

// Main function to coordinate the seeding process
async function seedDatabase() {
  console.log('🚀 Starting database seeding...');
  
  try {
    // Check database setup
    await checkDatabaseSetup();
    
    // Proceed with seeding
    await seedUsers();
    await seedGroups();
    await seedGroupMembers();
    await seedExpenses();
    await seedExpenseParticipants();
    await seedPayments();
    
    console.log('\n✅ Database seeding completed successfully!');
  } catch (error) {
    console.error('\n❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase(); 