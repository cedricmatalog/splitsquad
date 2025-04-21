import { supabase } from '@/lib/supabase';
import { Payment } from '@/types';

// Get all payments
export async function getPayments(filter?: Partial<Payment>): Promise<Payment[]> {
  try {
    let query = supabase.from('payments').select('*');

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
    return data.map(item => convertFromPaymentDB(item));
  } catch (error) {
    console.error(`Error getting payments:`, error);
    return [];
  }
}

// Get a single payment by ID
export async function getPaymentById(id: string): Promise<Payment | null> {
  try {
    const { data, error } = await supabase.from('payments').select('*').eq('id', id).single();

    if (error) throw error;
    if (!data) return null;

    return convertFromPaymentDB(data);
  } catch (error) {
    console.error(`Error getting payment by ID:`, error);
    return null;
  }
}

// Create a new payment
export async function createPayment(payment: Omit<Payment, 'id'>): Promise<Payment | null> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .insert(convertToPaymentDB(payment))
      .select()
      .single();

    if (error) throw error;

    return convertFromPaymentDB(data);
  } catch (error) {
    console.error(`Error creating payment:`, error);
    return null;
  }
}

// Update an existing payment
export async function updatePayment(
  id: string,
  payment: Partial<Payment>
): Promise<Payment | null> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .update(convertToPaymentDB(payment))
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return convertFromPaymentDB(data);
  } catch (error) {
    console.error(`Error updating payment:`, error);
    return null;
  }
}

// Delete a payment
export async function deletePayment(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('payments').delete().eq('id', id);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error(`Error deleting payment:`, error);
    return false;
  }
}

// Helper function to convert database format to app format
function convertFromPaymentDB(dbItem: unknown): Payment {
  const item = dbItem as Record<string, unknown>;
  return {
    id: item.id as string,
    groupId: item.group_id as string,
    fromUser: item.from_user as string,
    toUser: item.to_user as string,
    amount: parseFloat(item.amount as string),
    date: (item.date as string) || new Date().toISOString().split('T')[0],
  };
}

// Helper function to convert app format to database format
function convertToPaymentDB(appItem: Partial<Payment>): Record<string, unknown> {
  const { groupId, fromUser, toUser, ...rest } = appItem;
  return {
    ...rest,
    group_id: groupId,
    from_user: fromUser,
    to_user: toUser,
    // Add timestamp fields if missing
    ...(appItem.id ? {} : { created_at: new Date().toISOString() }),
    updated_at: new Date().toISOString(),
  };
}
