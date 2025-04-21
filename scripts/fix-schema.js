// scripts/fix-schema.js
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

// Get the SQL script
const sqlScriptPath = path.join(__dirname, 'fix-schema.sql');
const sqlScript = fs.readFileSync(sqlScriptPath, 'utf8');

async function fixSchema() {
  console.log('🔧 Running schema fix script...');
  
  try {
    // Execute the SQL script
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlScript });
    
    if (error) {
      console.error('Error executing SQL script directly:', error);
      console.log('Attempting to execute in chunks...');
      
      // Try executing statement by statement
      const statements = sqlScript
        .split(';')
        .map(statement => statement.trim())
        .filter(statement => statement.length > 0);
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        console.log(`Executing statement ${i+1}/${statements.length}`);
        
        try {
          const { data, error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
          if (error) {
            console.warn(`Warning: Error executing statement ${i+1}:`, error);
          }
        } catch (stmtError) {
          console.warn(`Warning: Exception executing statement ${i+1}:`, stmtError);
        }
      }
      
      console.log('Finished executing statements individually');
    } else {
      console.log('✅ SQL script executed successfully');
    }
    
    // Check if schema is correct now
    try {
      const { data: userTest, error: userTestError } = await supabase
        .from('users')
        .select('*')
        .limit(1);
      
      if (userTestError) {
        console.error('⚠️ Schema still has issues:', userTestError);
      } else {
        console.log('✅ Schema validation passed');
      }
    } catch (testError) {
      console.error('⚠️ Error testing schema:', testError);
    }
    
  } catch (error) {
    console.error('❌ Error fixing schema:', error);
  }
  
  console.log('Schema fix attempt completed.');
  console.log('If issues persist, please execute the SQL script manually in the Supabase SQL Editor.');
}

fixSchema(); 