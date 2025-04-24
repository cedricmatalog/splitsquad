'use client';

import { Card, CardContent } from '@/components/ui';
import { Button } from '@/components/ui';
import { Expense, ExpenseParticipant } from '@/types';
import { ExpenseFormHeader } from './ExpenseFormHeader';
import { ExpenseFormShares } from './ExpenseFormShares';
import { ExpenseFormSplitType } from './ExpenseFormSplitType';
import { ExpenseFormField } from './ExpenseFormField';
import { DescriptionInput } from './DescriptionInput';
import { AmountInput } from './AmountInput';
import { GroupSelect } from './GroupSelect';
import { UserSelect } from './UserSelect';
import { DateSelectField } from './DateSelectField';
import { useExpenseForm } from './useExpenseForm';

interface ExpenseFormProps {
  groupId?: string;
  expense?: Expense;
  expenseParticipants?: ExpenseParticipant[];
  isEditing?: boolean;
}

export function ExpenseForm({
  groupId: initialGroupId,
  expense,
  expenseParticipants,
  isEditing = false,
}: ExpenseFormProps) {
  const {
    // Form state
    description,
    setDescription,
    amount,
    selectedGroupId,
    paidBy,
    setPaidBy,
    date,
    setDate,
    isSubmitting,
    errors,

    // Derived data
    userGroups,
    groupMembersMemo,

    // Share calculation
    shares,
    splitType,
    updateShareAmount, // from useShareCalculation
    toggleMember, // from useShareCalculation

    // Event handlers
    handleGroupChange,
    handleAmountChange,
    handleSplitTypeChange,
    handleSubmit,

    // Helpers
    getUserName,
    getUserAvatar,

    // Navigation
    router,
  } = useExpenseForm({
    initialGroupId,
    expense,
    expenseParticipants,
    isEditing,
  });

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <ExpenseFormHeader isEditing={isEditing} />
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <ExpenseFormField label="Description" error={errors.description}>
              <DescriptionInput
                value={description}
                onChange={setDescription}
                error={errors.description}
              />
            </ExpenseFormField>

            <ExpenseFormField label="Amount" error={errors.amount}>
              <AmountInput value={amount} onChange={handleAmountChange} error={errors.amount} />
            </ExpenseFormField>

            <ExpenseFormField label="Group" error={errors.group}>
              <GroupSelect
                value={selectedGroupId}
                onChange={handleGroupChange}
                groups={userGroups}
                error={errors.group}
              />
            </ExpenseFormField>

            <ExpenseFormField label="Paid By" error={errors.paidBy}>
              <UserSelect
                value={paidBy}
                onChange={setPaidBy}
                users={groupMembersMemo}
                error={errors.paidBy}
                placeholder="Select who paid"
                currentUserId={undefined}
              />
            </ExpenseFormField>

            <ExpenseFormField label="Date">
              <DateSelectField value={date} onChange={setDate} />
            </ExpenseFormField>

            <ExpenseFormField label="Split Type">
              <ExpenseFormSplitType
                splitType={splitType}
                onChange={value => handleSplitTypeChange(value as 'equal' | 'custom')}
              />
            </ExpenseFormField>

            <ExpenseFormField
              label="Split Details"
              error={errors.shares}
              description={
                splitType === 'equal'
                  ? 'Use checkboxes to include/exclude members'
                  : 'Customize each share amount'
              }
            >
              <div className="space-y-2 max-h-60 overflow-y-auto p-1">
                {shares.map(share => (
                  <ExpenseFormShares
                    key={share.userId}
                    userId={share.userId}
                    userName={getUserName(share.userId)}
                    userAvatar={getUserAvatar(share.userId)}
                    share={share.share}
                    totalAmount={parseFloat(amount) || 0}
                    splitType={splitType}
                    onShareChange={updateShareAmount}
                    onMemberToggle={(userId, isEnabled) =>
                      toggleMember(userId, isEnabled, parseFloat(amount) || 0)
                    }
                  />
                ))}
              </div>
            </ExpenseFormField>
          </div>

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-md p-3">
              {errors.submit}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEditing ? 'Update Expense' : 'Create Expense'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
