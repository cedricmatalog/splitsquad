const fs = require('fs');
const path = require('path');

// Paths to relevant files
const appContextPath = path.join(__dirname, '../src/context/AppContext.tsx');
const authServicePath = path.join(__dirname, '../src/services/auth.ts');
const servicesDir = path.join(__dirname, '../src/services');

// Check if the services directory exists, if not create it
if (!fs.existsSync(servicesDir)) {
  fs.mkdirSync(servicesDir, { recursive: true });
}

// Read the current AppContext file
let appContextContent = '';
try {
  appContextContent = fs.readFileSync(appContextPath, 'utf8');
  console.log('✅ Successfully read AppContext.tsx');
} catch (error) {
  console.error('❌ Error reading AppContext.tsx:', error);
  process.exit(1);
}

// Create service files for data entities
function createServiceFile(entity, pluralEntity) {
  const capitalizedEntity = entity.charAt(0).toUpperCase() + entity.slice(1);
  const serviceContent = `
import { supabase } from '@/lib/supabase';
import { ${capitalizedEntity} } from '@/types';

// Get all ${pluralEntity}
export async function get${capitalizedEntity}s(filter?: Partial<${capitalizedEntity}>): Promise<${capitalizedEntity}[]> {
  try {
    let query = supabase
      .from('${pluralEntity.toLowerCase()}')
      .select('*');
    
    // Apply filters if provided
    if (filter) {
      Object.entries(filter).forEach(([key, value]) => {
        if (value !== undefined) {
          query = query.eq(key, value);
        }
      });
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Convert from database format to app format
    return data.map(item => convertFrom${capitalizedEntity}DB(item));
  } catch (error) {
    console.error(\`Error getting ${pluralEntity}:\`, error);
    return [];
  }
}

// Get a single ${entity} by ID
export async function get${capitalizedEntity}ById(id: string): Promise<${capitalizedEntity} | null> {
  try {
    const { data, error } = await supabase
      .from('${pluralEntity.toLowerCase()}')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    if (!data) return null;
    
    return convertFrom${capitalizedEntity}DB(data);
  } catch (error) {
    console.error(\`Error getting ${entity} by ID:\`, error);
    return null;
  }
}

// Create a new ${entity}
export async function create${capitalizedEntity}(${entity}: Omit<${capitalizedEntity}, 'id'>): Promise<${capitalizedEntity} | null> {
  try {
    const { data, error } = await supabase
      .from('${pluralEntity.toLowerCase()}')
      .insert(convertTo${capitalizedEntity}DB(${entity}))
      .select()
      .single();
    
    if (error) throw error;
    
    return convertFrom${capitalizedEntity}DB(data);
  } catch (error) {
    console.error(\`Error creating ${entity}:\`, error);
    return null;
  }
}

// Update an existing ${entity}
export async function update${capitalizedEntity}(id: string, ${entity}: Partial<${capitalizedEntity}>): Promise<${capitalizedEntity} | null> {
  try {
    const { data, error } = await supabase
      .from('${pluralEntity.toLowerCase()}')
      .update(convertTo${capitalizedEntity}DB({...${entity}, id}))
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return convertFrom${capitalizedEntity}DB(data);
  } catch (error) {
    console.error(\`Error updating ${entity}:\`, error);
    return null;
  }
}

// Delete a ${entity}
export async function delete${capitalizedEntity}(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('${pluralEntity.toLowerCase()}')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error(\`Error deleting ${entity}:\`, error);
    return false;
  }
}

// Helper function to convert database format to app format
function convertFrom${capitalizedEntity}DB(dbItem: any): ${capitalizedEntity} {
  // TO-DO: Implement the conversion from database fields to app fields
  // Example for User:
  // return {
  //   id: dbItem.id,
  //   name: dbItem.name,
  //   email: dbItem.email,
  //   avatar: dbItem.avatar_url || '',
  // };
  
  // This is a placeholder, update it based on your actual data structure
  return dbItem as ${capitalizedEntity};
}

// Helper function to convert app format to database format
function convertTo${capitalizedEntity}DB(appItem: Partial<${capitalizedEntity}>): any {
  // TO-DO: Implement the conversion from app fields to database fields
  // Example for User:
  // const { avatar, ...rest } = appItem;
  // return {
  //   ...rest,
  //   avatar_url: avatar,
  // };
  
  // This is a placeholder, update it based on your actual data structure
  return appItem;
}
`;

  const serviceFilePath = path.join(servicesDir, `${pluralEntity.toLowerCase()}.ts`);
  
  try {
    fs.writeFileSync(serviceFilePath, serviceContent.trim());
    console.log(`✅ Created service file for ${entity}: ${serviceFilePath}`);
  } catch (error) {
    console.error(`❌ Error creating service file for ${entity}:`, error);
  }
}

// Create service files for each entity
createServiceFile('user', 'users');
createServiceFile('group', 'groups');
createServiceFile('expense', 'expenses');
createServiceFile('groupMember', 'group_members');
createServiceFile('expenseParticipant', 'expense_participants');
createServiceFile('payment', 'payments');

// Create modified auth.ts if it doesn't exist
try {
  if (!fs.existsSync(authServicePath)) {
    const authServiceContent = `
import { supabase } from '@/lib/supabase';
import { User } from '@/types';

export async function signUp(email: string, password: string, name: string): Promise<User | null> {
  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }
      }
    });

    if (authError) throw authError;
    if (!authData.user) return null;

    // Create user profile in our users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        auth_id: authData.user.id,
        name,
        email,
        avatar_url: \`https://ui-avatars.com/api/?name=\${encodeURIComponent(name)}&background=random\`
      })
      .select()
      .single();

    if (userError) throw userError;
    
    // Convert to our app User type
    return {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      avatar: userData.avatar_url || ''
    };
  } catch (error) {
    console.error('Error during sign up:', error);
    return null;
  }
}

export async function signIn(email: string, password: string): Promise<User | null> {
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) throw authError;
    if (!authData.user) return null;

    // Get user profile from our users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', authData.user.id)
      .single();

    if (userError) throw userError;
    
    // Convert to our app User type
    return {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      avatar: userData.avatar_url || ''
    };
  } catch (error) {
    console.error('Error during sign in:', error);
    return null;
  }
}

export async function signOut(): Promise<void> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error('Error during sign out:', error);
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError) throw authError;
    if (!session?.user) return null;
    
    // Get user profile from our users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', session.user.id)
      .single();
      
    if (userError) throw userError;
    
    // Convert to our app User type
    return {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      avatar: userData.avatar_url || ''
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}
`;

    fs.writeFileSync(authServicePath, authServiceContent.trim());
    console.log(`✅ Created auth service file: ${authServicePath}`);
  } else {
    console.log(`⚠️ Auth service file already exists, skipping creation: ${authServicePath}`);
  }
} catch (error) {
  console.error('❌ Error handling auth service file:', error);
}

// Create a modified AppContext.tsx.example for reference
const modifiedAppContextPath = path.join(__dirname, '../src/context/AppContext.tsx.supabase-example');
const modifiedAppContextContent = `
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Group, Expense, GroupMember, ExpenseParticipant, Payment } from '@/types';
import { getCurrentUser, signIn, signOut, signUp } from '@/services/auth';
import * as userService from '@/services/users';
import * as groupService from '@/services/groups';
import * as expenseService from '@/services/expenses';
import * as groupMemberService from '@/services/group_members';
import * as expenseParticipantService from '@/services/expense_participants';
import * as paymentService from '@/services/payments';

interface AppContextType {
  // State
  users: User[];
  groups: Group[];
  expenses: Expense[];
  groupMembers: GroupMember[];
  expenseParticipants: ExpenseParticipant[];
  payments: Payment[];
  
  // Current user state
  currentUser: User | null;
  isAuthenticated: boolean;
  
  // State setters
  setUsers: (users: User[]) => void;
  setGroups: (groups: Group[]) => void;
  setExpenses: (expenses: Expense[]) => void;
  setGroupMembers: (groupMembers: GroupMember[]) => void;
  setExpenseParticipants: (expenseParticipants: ExpenseParticipant[]) => void;
  setPayments: (payments: Payment[]) => void;
  setCurrentUser: (user: User | null) => void;
  
  // Auth functions
  login: (email: string, password: string) => Promise<User | null>;
  signup: (name: string, email: string, password: string) => Promise<User | null>;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  // State for all entities
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [expenseParticipants, setExpenseParticipants] = useState<ExpenseParticipant[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    async function loadInitialData() {
      setLoading(true);
      try {
        // Check if user is already authenticated
        const user = await getCurrentUser();
        setCurrentUser(user);
        
        if (user) {
          // Load all data
          const usersData = await userService.getUsers();
          setUsers(usersData);
          
          const groupsData = await groupService.getGroups();
          setGroups(groupsData);
          
          const expensesData = await expenseService.getExpenses();
          setExpenses(expensesData);
          
          const groupMembersData = await groupMemberService.getGroupMembers();
          setGroupMembers(groupMembersData);
          
          const expenseParticipantsData = await expenseParticipantService.getExpenseParticipants();
          setExpenseParticipants(expenseParticipantsData);
          
          const paymentsData = await paymentService.getPayments();
          setPayments(paymentsData);
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadInitialData();
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<User | null> => {
    try {
      const user = await signIn(email, password);
      
      if (user) {
        setCurrentUser(user);
        
        // Reload all data
        const usersData = await userService.getUsers();
        setUsers(usersData);
        
        const groupsData = await groupService.getGroups();
        setGroups(groupsData);
        
        const expensesData = await expenseService.getExpenses();
        setExpenses(expensesData);
        
        const groupMembersData = await groupMemberService.getGroupMembers();
        setGroupMembers(groupMembersData);
        
        const expenseParticipantsData = await expenseParticipantService.getExpenseParticipants();
        setExpenseParticipants(expenseParticipantsData);
        
        const paymentsData = await paymentService.getPayments();
        setPayments(paymentsData);
      }
      
      return user;
    } catch (error) {
      console.error('Error during login:', error);
      return null;
    }
  };

  // Signup function
  const signup = async (name: string, email: string, password: string): Promise<User | null> => {
    try {
      const user = await signUp(email, password, name);
      
      if (user) {
        setCurrentUser(user);
        setUsers(prevUsers => [...prevUsers, user]);
      }
      
      return user;
    } catch (error) {
      console.error('Error during signup:', error);
      return null;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await signOut();
      setCurrentUser(null);
      
      // Clear all data
      setUsers([]);
      setGroups([]);
      setExpenses([]);
      setGroupMembers([]);
      setExpenseParticipants([]);
      setPayments([]);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <AppContext.Provider
      value={{
        users,
        groups,
        expenses,
        groupMembers,
        expenseParticipants,
        payments,
        setUsers,
        setGroups,
        setExpenses,
        setGroupMembers,
        setExpenseParticipants,
        setPayments,
        currentUser,
        setCurrentUser,
        isAuthenticated: !!currentUser,
        login,
        signup,
        logout,
      }}
    >
      {!loading && children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  
  return context;
}
`;

try {
  fs.writeFileSync(modifiedAppContextPath, modifiedAppContextContent.trim());
  console.log(`✅ Created Supabase example AppContext file: ${modifiedAppContextPath}`);
} catch (error) {
  console.error('❌ Error creating Supabase example AppContext file:', error);
}

console.log(`
🎉 Migration files created!

Next steps:

1. Run the seed script to populate your Supabase database:
   npm run seed:supabase

2. Review the generated service files in the src/services directory
   and update the conversion functions as needed.

3. Use the AppContext.tsx.supabase-example file as a reference to update
   your application to use Supabase instead of mock data.

4. Update your application components to handle loading states and 
   async data fetching.
`); 