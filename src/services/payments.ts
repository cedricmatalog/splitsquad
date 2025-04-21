import { Payment } from '@/types';
import { useAppContext } from '@/context/AppContext';

// Create a custom hook for payment operations
export function usePayments() {
  const { payments, setPayments } = useAppContext();

  /**
   * Get all payments, optionally filtered by groupId
   * @param groupId Optional group ID to filter payments
   * @returns Array of Payment objects
   */
  const getPayments = (groupId?: string): Payment[] => {
    // Filter by groupId if provided
    if (groupId) {
      return payments.filter(payment => payment.groupId === groupId);
    }

    return payments;
  };

  /**
   * Get a payment by ID
   * @param id Payment ID
   * @returns Payment object or null if not found
   */
  const getPaymentById = (id: string): Payment | null => {
    const payment = payments.find(payment => payment.id === id);

    return payment || null;
  };

  /**
   * Create a new payment
   * @param payment Payment data without ID
   * @returns The created Payment object
   */
  const createPayment = (payment: Omit<Payment, 'id'>): Payment => {
    const newPayment: Payment = {
      id: `payment-${Math.random().toString(36).substr(2, 9)}`, // Generate random ID
      ...payment,
    };

    // Add to the AppContext state
    setPayments(prevPayments => [...prevPayments, newPayment]);

    return newPayment;
  };

  /**
   * Update an existing payment
   * @param id Payment ID
   * @param payment Updated payment data
   * @returns The updated Payment object or null if not found
   */
  const updatePayment = (id: string, payment: Omit<Payment, 'id'>): Payment | null => {
    // Check if payment exists
    const existingPaymentIndex = payments.findIndex(p => p.id === id);
    if (existingPaymentIndex === -1) {
      return null;
    }

    // Create updated payment
    const updatedPayment: Payment = {
      id,
      ...payment,
    };

    // Update in the AppContext state
    const updatedPayments = [...payments];
    updatedPayments[existingPaymentIndex] = updatedPayment;
    setPayments(updatedPayments);

    return updatedPayment;
  };

  /**
   * Delete a payment by ID
   * @param id Payment ID
   * @returns Boolean indicating success
   */
  const deletePayment = (id: string): boolean => {
    // Check if payment exists
    const existingPaymentIndex = payments.findIndex(p => p.id === id);
    if (existingPaymentIndex === -1) {
      return false;
    }

    // Remove from the AppContext state
    setPayments(payments.filter(payment => payment.id !== id));

    return true;
  };

  return {
    getPayments,
    getPaymentById,
    createPayment,
    updatePayment,
    deletePayment,
  };
}
