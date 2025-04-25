import { supabase } from '@/lib/supabase';
import { Payment } from '@/types';

/**
 * Retrieves all payments from the database with optional filtering
 *
 * @param {Partial<Payment>} [filter] - Optional filter criteria for payments
 * @returns {Promise<Payment[]>} Array of payment objects matching the filter
 *
 * @example
 * // Get all payments
 * const allPayments = await getPayments();
 *
 * // Get payments for a specific group
 * const groupPayments = await getPayments({ groupId: 'group-123' });
 */
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

/**
 * Retrieves a single payment by its ID
 *
 * @param {string} id - The ID of the payment to retrieve
 * @returns {Promise<Payment | null>} The payment object if found, null otherwise
 */
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

/**
 * Creates a new payment in the database
 *
 * @param {Omit<Payment, 'id'>} payment - The payment data to create (without ID)
 * @returns {Promise<Payment | null>} The created payment with its ID if successful, null on error
 *
 * @throws Will validate payment data and throw errors for invalid payments
 */
export async function createPayment(payment: Omit<Payment, 'id'>): Promise<Payment | null> {
  try {
    // Validate payment data
    if (!payment.groupId || !payment.fromUser || !payment.toUser || !payment.date) {
      throw new Error('Missing required payment fields');
    }

    if (payment.amount <= 0) {
      throw new Error('Payment amount must be greater than zero');
    }

    if (payment.fromUser === payment.toUser) {
      throw new Error('Payment sender and receiver cannot be the same user');
    }

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

/**
 * Updates an existing payment in the database
 *
 * @param {string} id - The ID of the payment to update
 * @param {Partial<Payment>} payment - The payment fields to update
 * @returns {Promise<Payment | null>} The updated payment if successful, null on error
 */
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

/**
 * Deletes a payment from the database
 *
 * @param {string} id - The ID of the payment to delete
 * @returns {Promise<boolean>} True if deletion was successful, false otherwise
 */
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

/**
 * Converts a payment from database format to application format
 * Handles field name transformations and data type conversions
 *
 * @param {unknown} dbItem - The raw database record
 * @returns {Payment} The formatted payment object for application use
 */
function convertFromPaymentDB(dbItem: unknown): Payment {
  const item = dbItem as Record<string, unknown>;
  return {
    id: item.id as string,
    groupId: item.group_id as string,
    fromUser: item.from_user as string,
    toUser: item.to_user as string,
    amount: parseFloat(item.amount as string),
    date: (item.date as string) || new Date().toISOString().split('T')[0],
    paymentMethod: item.payment_method as string,
    notes: item.notes as string,
  };
}

/**
 * Converts a payment from application format to database format
 * Handles field name transformations and adds timestamps
 *
 * @param {Partial<Payment>} appItem - The application payment object
 * @returns {Record<string, unknown>} The formatted database record for storing
 */
function convertToPaymentDB(appItem: Partial<Payment>): Record<string, unknown> {
  const { groupId, fromUser, toUser, paymentMethod, notes, ...rest } = appItem;
  return {
    ...rest,
    group_id: groupId,
    from_user: fromUser,
    to_user: toUser,
    payment_method: paymentMethod,
    notes: notes,
    // Add timestamp fields if missing
    ...(appItem.id ? {} : { created_at: new Date().toISOString() }),
    updated_at: new Date().toISOString(),
  };
}
