import { supabase } from '@/lib/supabase';
import { Expense } from '@/types';

// Get all expenses
export async function getExpenses(filter?: Partial<Expense>): Promise<Expense[]> {
  try {
    let query = supabase.from('expenses').select('*');

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
    return data.map(item => convertFromExpenseDB(item));
  } catch (error) {
    console.error(`Error getting expenses:`, error);
    return [];
  }
}

// Get a single expense by ID
export async function getExpenseById(id: string): Promise<Expense | null> {
  try {
    const { data, error } = await supabase.from('expenses').select('*').eq('id', id).single();

    if (error) throw error;
    if (!data) return null;

    return convertFromExpenseDB(data);
  } catch (error) {
    console.error(`Error getting expense by ID:`, error);
    return null;
  }
}

// Create a new expense
export async function createExpense(expense: Omit<Expense, 'id'>): Promise<Expense | null> {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .insert(convertToExpenseDB(expense))
      .select()
      .single();

    if (error) throw error;

    return convertFromExpenseDB(data);
  } catch (error) {
    console.error(`Error creating expense:`, error);
    return null;
  }
}

// Update an existing expense
export async function updateExpense(
  id: string,
  expense: Partial<Expense>
): Promise<Expense | null> {
  try {
    console.log(`Updating expense ${id} with data:`, expense);
    const dbData = convertToExpenseDB({ ...expense, id });
    console.log('Converted to DB format:', dbData);

    const { data, error } = await supabase
      .from('expenses')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error updating expense:', error);
      throw error;
    }

    console.log('Expense updated successfully, received:', data);
    return convertFromExpenseDB(data);
  } catch (error) {
    console.error(`Error updating expense:`, error);
    return null;
  }
}

// Delete a expense
export async function deleteExpense(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('expenses').delete().eq('id', id);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error(`Error deleting expense:`, error);
    return false;
  }
}

// Helper function to convert database format to app format
function convertFromExpenseDB(dbItem: unknown): Expense {
  const item = dbItem as Record<string, unknown>;
  return {
    id: item.id as string,
    groupId: item.group_id as string,
    description: item.description as string,
    amount: parseFloat(item.amount as string),
    paidBy: item.paid_by as string,
    date: (item.date as string) || new Date().toISOString().split('T')[0],
  };
}

// Helper function to convert app format to database format
function convertToExpenseDB(appItem: Partial<Expense>): Record<string, unknown> {
  const { groupId, paidBy, ...rest } = appItem;
  return {
    ...rest,
    group_id: groupId,
    paid_by: paidBy,
    // Add timestamp fields if missing
    ...(appItem.id ? {} : { created_at: new Date().toISOString() }),
    updated_at: new Date().toISOString(),
  };
}
