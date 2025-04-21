import { supabase } from '@/lib/supabase';
import { User } from '@/types';

// Get all users
export async function getUsers(filter?: Partial<User>): Promise<User[]> {
  try {
    let query = supabase.from('users').select('*');

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
    return data.map(item => convertFromUserDB(item));
  } catch (error) {
    console.error(`Error getting users:`, error);
    return [];
  }
}

// Get a single user by ID
export async function getUserById(id: string): Promise<User | null> {
  try {
    const { data, error } = await supabase.from('users').select('*').eq('id', id).single();

    if (error) throw error;
    if (!data) return null;

    return convertFromUserDB(data);
  } catch (error) {
    console.error(`Error getting user by ID:`, error);
    return null;
  }
}

// Create a new user
export async function createUser(user: Omit<User, 'id'>): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert(convertToUserDB(user))
      .select()
      .single();

    if (error) throw error;

    return convertFromUserDB(data);
  } catch (error) {
    console.error(`Error creating user:`, error);
    return null;
  }
}

// Update an existing user
export async function updateUser(id: string, user: Partial<User>): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(convertToUserDB(user))
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return convertFromUserDB(data);
  } catch (error) {
    console.error(`Error updating user:`, error);
    return null;
  }
}

// Delete a user
export async function deleteUser(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('users').delete().eq('id', id);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error(`Error deleting user:`, error);
    return false;
  }
}

// Helper function to convert database format to app format
function convertFromUserDB(dbItem: unknown): User {
  const item = dbItem as Record<string, unknown>;
  return {
    id: item.id as string,
    name: item.name as string,
    email: item.email as string,
    avatar: (item.avatar_url as string) || '',
  };
}

// Helper function to convert app format to database format
function convertToUserDB(appItem: Partial<User>): Record<string, unknown> {
  const { avatar, ...rest } = appItem;
  return {
    ...rest,
    avatar_url: avatar,
  };
}
