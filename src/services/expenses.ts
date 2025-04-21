import { supabase } from '@/lib/supabase';
import { Expense, ExpenseParticipant } from '@/types';

export async function getExpenses(groupId?: string): Promise<Expense[]> {
  try {
    let query = supabase.from('expenses').select('*').order('date', { ascending: false });

    if (groupId) {
      query = query.eq('group_id', groupId);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Convert to our app Expense type
    return (data || []).map(item => ({
      id: item.id,
      groupId: item.group_id,
      description: item.description,
      amount: item.amount,
      paidBy: item.paid_by,
      date: item.date,
    }));
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return [];
  }
}

export async function getExpenseById(id: string): Promise<Expense | null> {
  try {
    const { data, error } = await supabase.from('expenses').select('*').eq('id', id).single();

    if (error) throw error;
    if (!data) return null;

    // Convert to our app Expense type
    return {
      id: data.id,
      groupId: data.group_id,
      description: data.description,
      amount: data.amount,
      paidBy: data.paid_by,
      date: data.date,
    };
  } catch (error) {
    console.error(`Error fetching expense with id ${id}:`, error);
    return null;
  }
}

export async function getExpenseParticipants(expenseId: string): Promise<ExpenseParticipant[]> {
  try {
    const { data, error } = await supabase
      .from('expense_participants')
      .select('*')
      .eq('expense_id', expenseId);

    if (error) throw error;

    // Convert to our app ExpenseParticipant type
    return (data || []).map(item => ({
      expenseId: item.expense_id,
      userId: item.user_id,
      share: item.share,
    }));
  } catch (error) {
    console.error(`Error fetching participants for expense ${expenseId}:`, error);
    return [];
  }
}

export async function createExpense(
  expense: Omit<Expense, 'id'>,
  participants: Omit<ExpenseParticipant, 'expenseId'>[]
): Promise<Expense | null> {
  try {
    // First create the expense
    const { data: expenseData, error: expenseError } = await supabase
      .from('expenses')
      .insert({
        group_id: expense.groupId,
        description: expense.description,
        amount: expense.amount,
        paid_by: expense.paidBy,
        date: expense.date,
      })
      .select()
      .single();

    if (expenseError) throw expenseError;

    // Then create the participants
    const participantsData = participants.map(participant => ({
      expense_id: expenseData.id,
      user_id: participant.userId,
      share: participant.share,
    }));

    const { error: participantsError } = await supabase
      .from('expense_participants')
      .insert(participantsData);

    if (participantsError) throw participantsError;

    // Return the created expense
    return {
      id: expenseData.id,
      groupId: expenseData.group_id,
      description: expenseData.description,
      amount: expenseData.amount,
      paidBy: expenseData.paid_by,
      date: expenseData.date,
    };
  } catch (error) {
    console.error('Error creating expense:', error);
    return null;
  }
}

export async function updateExpense(
  id: string,
  expense: Omit<Expense, 'id'>,
  participants: Omit<ExpenseParticipant, 'expenseId'>[]
): Promise<Expense | null> {
  try {
    // First update the expense
    const { data: expenseData, error: expenseError } = await supabase
      .from('expenses')
      .update({
        group_id: expense.groupId,
        description: expense.description,
        amount: expense.amount,
        paid_by: expense.paidBy,
        date: expense.date,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (expenseError) throw expenseError;

    // Delete old participants
    const { error: deleteError } = await supabase
      .from('expense_participants')
      .delete()
      .eq('expense_id', id);

    if (deleteError) throw deleteError;

    // Insert new participants
    const participantsData = participants.map(participant => ({
      expense_id: id,
      user_id: participant.userId,
      share: participant.share,
    }));

    const { error: participantsError } = await supabase
      .from('expense_participants')
      .insert(participantsData);

    if (participantsError) throw participantsError;

    // Return the updated expense
    return {
      id: expenseData.id,
      groupId: expenseData.group_id,
      description: expenseData.description,
      amount: expenseData.amount,
      paidBy: expenseData.paid_by,
      date: expenseData.date,
    };
  } catch (error) {
    console.error(`Error updating expense ${id}:`, error);
    return null;
  }
}

export async function deleteExpense(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('expenses').delete().eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error(`Error deleting expense ${id}:`, error);
    return false;
  }
}
