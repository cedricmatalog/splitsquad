import { supabase } from '@/lib/supabase';
import { GroupMember } from '@/types';

// Get all group_members
export async function getGroupMembers(filter?: Partial<GroupMember>): Promise<GroupMember[]> {
  try {
    let query = supabase.from('group_members').select('*');

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
    return data.map(item => convertFromGroupMemberDB(item));
  } catch (error) {
    console.error(`Error getting group_members:`, error);
    return [];
  }
}

// Get a single groupMember by ID
export async function getGroupMemberById(id: string): Promise<GroupMember | null> {
  try {
    const { data, error } = await supabase.from('group_members').select('*').eq('id', id).single();

    if (error) throw error;
    if (!data) return null;

    return convertFromGroupMemberDB(data);
  } catch (error) {
    console.error(`Error getting groupMember by ID:`, error);
    return null;
  }
}

// Create a new groupMember
export async function createGroupMember(
  groupMember: Omit<GroupMember, 'id'>
): Promise<GroupMember | null> {
  try {
    const { data, error } = await supabase
      .from('group_members')
      .insert(convertToGroupMemberDB(groupMember))
      .select()
      .single();

    if (error) throw error;

    return convertFromGroupMemberDB(data);
  } catch (error) {
    console.error(`Error creating groupMember:`, error);
    return null;
  }
}

// Update an existing groupMember
export async function updateGroupMember(
  id: string,
  groupMember: Partial<GroupMember>
): Promise<GroupMember | null> {
  try {
    const { data, error } = await supabase
      .from('group_members')
      .update(convertToGroupMemberDB(groupMember))
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return convertFromGroupMemberDB(data);
  } catch (error) {
    console.error(`Error updating groupMember:`, error);
    return null;
  }
}

// Delete a groupMember
export async function deleteGroupMember(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('group_members').delete().eq('id', id);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error(`Error deleting groupMember:`, error);
    return false;
  }
}

// Helper function to convert database format to app format
function convertFromGroupMemberDB(dbItem: unknown): GroupMember {
  const item = dbItem as Record<string, unknown>;
  return {
    userId: item.user_id as string,
    groupId: item.group_id as string,
  };
}

// Helper function to convert app format to database format
function convertToGroupMemberDB(appItem: Partial<GroupMember>): Record<string, unknown> {
  const { userId, groupId, ...rest } = appItem;
  return {
    ...rest,
    user_id: userId,
    group_id: groupId,
    // Add timestamp field if missing
    ...(appItem.userId && appItem.groupId ? {} : { created_at: new Date().toISOString() }),
  };
}
