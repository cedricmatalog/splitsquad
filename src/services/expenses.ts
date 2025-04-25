import { supabase } from '@/lib/supabase';
import { Expense } from '@/types';

/**
 * Retrieves all expenses from the database with optional filtering
 *
 * @param {Partial<Expense>} [filter] - Optional filter criteria for expenses
 * @returns {Promise<Expense[]>} Array of expense objects matching the filter
 *
 * @example
 * // Get all expenses
 * const allExpenses = await getExpenses();
 *
 * // Get expenses for a specific group
 * const groupExpenses = await getExpenses({ groupId: 'group-123' });
 */
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

/**
 * Retrieves a single expense by its ID
 *
 * @param {string} id - The ID of the expense to retrieve
 * @returns {Promise<Expense | null>} The expense object if found, null otherwise
 */
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

/**
 * Creates a new expense in the database
 *
 * @param {Omit<Expense, 'id'>} expense - The expense data to create (without ID)
 * @returns {Promise<Expense | null>} The created expense with its ID if successful, null on error
 */
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

/**
 * Updates an existing expense in the database
 *
 * @param {string} id - The ID of the expense to update
 * @param {Partial<Expense>} expense - The expense fields to update
 * @returns {Promise<Expense | null>} The updated expense if successful, null on error
 */
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

/**
 * Deletes an expense from the database
 *
 * @param {string} id - The ID of the expense to delete
 * @returns {Promise<boolean>} True if deletion was successful, false otherwise
 */
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

/**
 * Converts an expense from database format to application format
 * Handles field name transformations and data type conversions
 *
 * @param {unknown} dbItem - The raw database record
 * @returns {Expense} The formatted expense object for application use
 */
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

/**
 * Converts an expense from application format to database format
 * Handles field name transformations and adds timestamps
 *
 * @param {Partial<Expense>} appItem - The application expense object
 * @returns {Record<string, unknown>} The formatted database record for storing
 */
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
