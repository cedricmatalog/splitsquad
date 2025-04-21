import { supabase } from '@/lib/supabase';
import { Group } from '@/types';

// Get all groups
export async function getGroups(filter?: Partial<Group>): Promise<Group[]> {
  try {
    let query = supabase.from('groups').select('*');

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
    return data.map(item => convertFromGroupDB(item));
  } catch (error) {
    console.error(`Error getting groups:`, error);
    return [];
  }
}

// Get a single group by ID
export async function getGroupById(id: string): Promise<Group | null> {
  try {
    const { data, error } = await supabase.from('groups').select('*').eq('id', id).single();

    if (error) throw error;
    if (!data) return null;

    return convertFromGroupDB(data);
  } catch (error) {
    console.error(`Error getting group by ID:`, error);
    return null;
  }
}

// Create a new group
export async function createGroup(group: Omit<Group, 'id'>): Promise<Group | null> {
  try {
    const { data, error } = await supabase
      .from('groups')
      .insert(convertToGroupDB(group))
      .select()
      .single();

    if (error) throw error;

    return convertFromGroupDB(data);
  } catch (error) {
    console.error(`Error creating group:`, error);
    return null;
  }
}

// Update an existing group
export async function updateGroup(id: string, group: Partial<Group>): Promise<Group | null> {
  try {
    const { data, error } = await supabase
      .from('groups')
      .update(convertToGroupDB(group))
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return convertFromGroupDB(data);
  } catch (error) {
    console.error(`Error updating group:`, error);
    return null;
  }
}

// Delete a group
export async function deleteGroup(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('groups').delete().eq('id', id);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error(`Error deleting group:`, error);
    return false;
  }
}

// Helper function to convert database format to app format
function convertFromGroupDB(dbItem: unknown): Group {
  const item = dbItem as Record<string, unknown>;
  return {
    id: item.id as string,
    name: item.name as string,
    description: (item.description as string) || '',
    createdBy: item.created_by as string,
    date: (item.date as string) || new Date().toISOString().split('T')[0],
  };
}

// Helper function to convert app format to database format
function convertToGroupDB(appItem: Partial<Group>): Record<string, unknown> {
  const { createdBy, ...rest } = appItem;
  return {
    ...rest,
    created_by: createdBy,
    // Add timestamp fields if missing
    ...(appItem.id ? {} : { created_at: new Date().toISOString() }),
    updated_at: new Date().toISOString(),
  };
}
