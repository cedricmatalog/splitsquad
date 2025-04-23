import { supabase } from '@/lib/supabase';
import { ExpenseParticipant } from '@/types';

// Get all expense_participants
export async function getExpenseParticipants(
  filter?: Partial<ExpenseParticipant>
): Promise<ExpenseParticipant[]> {
  try {
    let query = supabase.from('expense_participants').select('*');

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
    return data.map(item => convertFromExpenseParticipantDB(item));
  } catch (error) {
    console.error(`Error getting expense_participants:`, error);
    return [];
  }
}

// Get a single expenseParticipant by ID
export async function getExpenseParticipantById(id: string): Promise<ExpenseParticipant | null> {
  try {
    const { data, error } = await supabase
      .from('expense_participants')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return null;

    return convertFromExpenseParticipantDB(data);
  } catch (error) {
    console.error(`Error getting expenseParticipant by ID:`, error);
    return null;
  }
}

// Create a new expenseParticipant
export async function createExpenseParticipant(
  expenseParticipant: Omit<ExpenseParticipant, 'id'>
): Promise<ExpenseParticipant | null> {
  try {
    console.log(`Creating expense participant:`, expenseParticipant);
    const dbData = convertToExpenseParticipantDB(expenseParticipant);
    console.log('Converted to DB format:', dbData);

    const { data, error } = await supabase
      .from('expense_participants')
      .insert(dbData)
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating expense participant:', error);
      throw error;
    }

    console.log('Expense participant created successfully:', data);
    return convertFromExpenseParticipantDB(data);
  } catch (error) {
    console.error(`Error creating expenseParticipant:`, error);
    return null;
  }
}

// Update an existing expenseParticipant
export async function updateExpenseParticipant(
  id: string,
  expenseParticipant: Partial<ExpenseParticipant>
): Promise<ExpenseParticipant | null> {
  try {
    const { data, error } = await supabase
      .from('expense_participants')
      .update(convertToExpenseParticipantDB(expenseParticipant))
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return convertFromExpenseParticipantDB(data);
  } catch (error) {
    console.error(`Error updating expenseParticipant:`, error);
    return null;
  }
}

// Delete a expenseParticipant
export async function deleteExpenseParticipant(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('expense_participants').delete().eq('id', id);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error(`Error deleting expenseParticipant:`, error);
    return false;
  }
}

// Delete expenseParticipants by expenseId and userId
export async function deleteExpenseParticipantByKeys(
  expenseId: string,
  userId: string
): Promise<boolean> {
  try {
    console.log(`Deleting expense participant: expenseId=${expenseId}, userId=${userId}`);

    // First check if the record exists
    const checkResult = await supabase
      .from('expense_participants')
      .select('*')
      .match({ expense_id: expenseId, user_id: userId });

    if (checkResult.error) {
      console.error('Error checking if expense participant exists:', checkResult.error);
      return false;
    }

    if (checkResult.data.length === 0) {
      console.log(`No expense participant found for expenseId=${expenseId}, userId=${userId}`);
      return true; // Nothing to delete, so technically successful
    }

    // Now perform the delete operation
    const { error } = await supabase
      .from('expense_participants')
      .delete()
      .match({ expense_id: expenseId, user_id: userId });

    if (error) {
      console.error('Supabase error deleting expense participant:', error);
      throw error;
    }

    console.log(
      `Successfully deleted expense participant for expenseId=${expenseId}, userId=${userId}`
    );
    return true;
  } catch (error) {
    console.error(`Error deleting expenseParticipant by keys:`, error);
    return false;
  }
}

// Replace all expense participants for an expense
export async function replaceExpenseParticipants(
  expenseId: string,
  newParticipants: Omit<ExpenseParticipant, 'expenseId'>[]
): Promise<boolean> {
  try {
    console.log(`Replacing all participants for expense ${expenseId}`);
    console.log(`New participants count: ${newParticipants.length}`);

    // First delete all existing participants
    const { error: deleteError } = await supabase
      .from('expense_participants')
      .delete()
      .eq('expense_id', expenseId);

    if (deleteError) {
      console.error('Error deleting existing participants:', deleteError);
      return false;
    }

    console.log(`Successfully deleted all existing participants for expense ${expenseId}`);

    // If we have no new participants, we're done
    if (newParticipants.length === 0) {
      return true;
    }

    // Now insert all new participants
    const dbParticipants = newParticipants.map(p => ({
      expense_id: expenseId,
      user_id: p.userId,
      share: p.share,
      created_at: new Date().toISOString(),
    }));

    console.log('Prepared participants for insertion:', dbParticipants);

    const { error: insertError } = await supabase
      .from('expense_participants')
      .insert(dbParticipants);

    if (insertError) {
      console.error('Error inserting new participants:', insertError);
      return false;
    }

    console.log(
      `Successfully inserted ${newParticipants.length} participants for expense ${expenseId}`
    );
    return true;
  } catch (error) {
    console.error('Error replacing expense participants:', error);
    return false;
  }
}

// Helper function to convert database format to app format
function convertFromExpenseParticipantDB(dbItem: unknown): ExpenseParticipant {
  const item = dbItem as Record<string, unknown>;
  return {
    expenseId: item.expense_id as string,
    userId: item.user_id as string,
    share: parseFloat(item.share as string),
  };
}

// Helper function to convert app format to database format
function convertToExpenseParticipantDB(
  appItem: Partial<ExpenseParticipant>
): Record<string, unknown> {
  const { expenseId, userId, ...rest } = appItem;
  return {
    ...rest,
    expense_id: expenseId,
    user_id: userId,
    // Add timestamp field if missing
    ...(appItem.expenseId && appItem.userId ? {} : { created_at: new Date().toISOString() }),
  };
}
