/* eslint-disable */
import { supabase } from '@/lib/supabase';
import { Group, User } from '@/types';

// Add a type for the response structure
type GroupMemberWithUser = {
  user_id: string;
  users: {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
  };
};

export async function getGroups(): Promise<Group[]> {
  try {
    const { data, error } = await supabase
      .from('groups')
      .select(
        `
        *,
        users!groups_created_by_fkey (
          id,
          name
        )
      `
      )
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Convert to our app Group type
    return (data || []).map(item => ({
      id: item.id,
      name: item.name,
      description: item.description || '',
      createdBy: item.created_by,
      date: item.date,
    }));
  } catch (error) {
    console.error('Error fetching groups:', error);
    return [];
  }
}

export async function getGroupById(id: string): Promise<Group | null> {
  try {
    const { data, error } = await supabase
      .from('groups')
      .select(
        `
        *,
        users!groups_created_by_fkey (
          id,
          name
        )
      `
      )
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return null;

    // Convert to our app Group type
    return {
      id: data.id,
      name: data.name,
      description: data.description || '',
      createdBy: data.created_by,
      date: data.date,
    };
  } catch (error) {
    console.error(`Error fetching group with id ${id}:`, error);
    return null;
  }
}

export async function getGroupMembers(groupId: string): Promise<User[]> {
  try {
    const { data, error } = await supabase
      .from('group_members')
      .select(
        `
        user_id,
        users (
          id,
          name,
          email,
          avatar_url
        )
      `
      )
      .eq('group_id', groupId);

    if (error) throw error;

    // Convert to our app User type
    // @ts-ignore Supabase data structure typing issue
    return (data || []).map(item => ({
      // @ts-ignore
      id: item.users.id,
      // @ts-ignore
      name: item.users.name,
      // @ts-ignore
      email: item.users.email,
      // @ts-ignore
      avatar: item.users.avatar_url || '',
    }));
  } catch (error) {
    console.error(`Error fetching members for group ${groupId}:`, error);
    return [];
  }
}

export async function createGroup(
  name: string,
  description: string,
  createdBy: string,
  memberIds: string[]
): Promise<Group | null> {
  try {
    // Start a transaction by getting the Supabase connection
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .insert({
        name,
        description,
        created_by: createdBy,
      })
      .select()
      .single();

    if (groupError) throw groupError;

    // Ensure creator is in the members list
    if (!memberIds.includes(createdBy)) {
      memberIds.push(createdBy);
    }

    // Add group members
    const groupMembers = memberIds.map(userId => ({
      group_id: group.id,
      user_id: userId,
    }));

    const { error: membersError } = await supabase.from('group_members').insert(groupMembers);

    if (membersError) throw membersError;

    // Return the created group
    return {
      id: group.id,
      name: group.name,
      description: group.description || '',
      createdBy: group.created_by,
      date: group.date,
    };
  } catch (error) {
    console.error('Error creating group:', error);
    return null;
  }
}

export async function updateGroup(
  id: string,
  name: string,
  description: string,
  memberIds?: string[]
): Promise<Group | null> {
  try {
    // Update group details
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .update({
        name,
        description,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (groupError) throw groupError;

    // If members were provided, update them
    if (memberIds && memberIds.length > 0) {
      // First delete existing members
      const { error: deleteError } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', id);

      if (deleteError) throw deleteError;

      // Then add new members
      const groupMembers = memberIds.map(userId => ({
        group_id: id,
        user_id: userId,
      }));

      const { error: membersError } = await supabase.from('group_members').insert(groupMembers);

      if (membersError) throw membersError;
    }

    // Return the updated group
    return {
      id: group.id,
      name: group.name,
      description: group.description || '',
      createdBy: group.created_by,
      date: group.date,
    };
  } catch (error) {
    console.error(`Error updating group ${id}:`, error);
    return null;
  }
}

export async function deleteGroup(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('groups').delete().eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error(`Error deleting group ${id}:`, error);
    return false;
  }
}
