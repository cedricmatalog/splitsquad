'use client';

/**
 * Calculate equal shares for a list of members based on the total amount
 * @param memberIds List of user IDs to split the amount between
 * @param amountValue Total amount to split
 * @returns Array of user IDs and their respective shares
 */
export function calculateEqualShares(memberIds: string[], amountValue: number) {
  if (memberIds.length === 0 || isNaN(amountValue)) {
    return [];
  }

  const equalShare = parseFloat((amountValue / memberIds.length).toFixed(2));
  const sharesData = memberIds.map(id => ({
    userId: id,
    share: equalShare,
  }));

  // Adjust first share to account for rounding errors
  const totalShares = sharesData.reduce((sum, share) => sum + share.share, 0);
  const diff = amountValue - totalShares;
  if (Math.abs(diff) > 0.01 && sharesData.length > 0) {
    sharesData[0].share = parseFloat((sharesData[0].share + diff).toFixed(2));
  }

  return sharesData;
}

/**
 * Validate expense form data
 * @param description Expense description
 * @param amount Expense amount
 * @param selectedGroupId Selected group ID
 * @param paidBy User ID who paid
 * @param shares List of shares for each user
 * @returns Object containing error messages, if any
 */
export function validateExpenseForm(
  description: string,
  amount: string,
  selectedGroupId: string,
  paidBy: string,
  shares: { userId: string; share: number }[]
) {
  const errors: { [key: string]: string } = {};

  if (!description.trim()) {
    errors.description = 'Description is required';
  }

  if (!amount) {
    errors.amount = 'Please enter a valid amount';
  } else {
    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      errors.amount = 'Please enter a valid amount';
    }
  }

  if (!selectedGroupId) {
    errors.group = 'Please select a group';
  }

  if (!paidBy) {
    errors.paidBy = 'Paid by is required';
  }

  // Validate that at least one share is greater than 0
  const totalShares = shares.reduce((sum, share) => sum + share.share, 0);
  if (totalShares <= 0) {
    errors.shares = 'At least one person must share the expense';
  }

  // Validate that total shares match amount
  if (totalShares > 0 && amount) {
    const amountValue = parseFloat(amount);
    if (!isNaN(amountValue) && Math.abs(totalShares - amountValue) > 0.02) {
      errors.shares = `Total shares ($${totalShares.toFixed(2)}) don't match expense amount ($${amountValue.toFixed(2)})`;
    }
  }

  return errors;
}
