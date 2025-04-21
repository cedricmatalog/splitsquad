'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import useExpenseCalculations from '@/hooks/useExpenseCalculations';
import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Expense, ExpenseParticipant } from '@/types';

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
  isEditing = false
}: ExpenseFormProps) {
  const router = useRouter();
  const { groups, users, setExpenses, setExpenseParticipants, currentUser } = useAppContext();
  const { getGroupMembers } = useExpenseCalculations();
  
  const [description, setDescription] = useState(expense?.description || '');
  const [amount, setAmount] = useState(expense?.amount?.toString() || '');
  const [selectedGroupId, setSelectedGroupId] = useState(initialGroupId || expense?.groupId || '');
  const [paidBy, setPaidBy] = useState(expense?.paidBy || currentUser?.id || '');
  const [date, setDate] = useState<Date>(expense?.date ? new Date(expense.date) : new Date());
  const [splitType, setSplitType] = useState('equal'); // equal, custom
  const [shares, setShares] = useState<{userId: string, share: number}[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  // When selectedGroupId changes, update shares based on group members
  useEffect(() => {
    if (selectedGroupId) {
      const members = getGroupMembers(selectedGroupId);
      const totalMembers = members.length;
      
      if (isEditing && expenseParticipants) {
        // If editing, use existing participants and their shares
        const existingShares = members.map(member => {
          const participant = expenseParticipants.find(p => p.userId === member.id);
          return {
            userId: member.id,
            share: participant?.share || 0
          };
        });
        setShares(existingShares);
        
        // Check if shares are equal
        const firstShare = existingShares[0]?.share;
        const isEqual = existingShares.every(s => Math.abs(s.share - firstShare) < 0.01);
        setSplitType(isEqual ? 'equal' : 'custom');
      } else if (totalMembers > 0 && amount !== '') {
        // For new expense, create equal shares
        const amountValue = parseFloat(amount);
        const equalShare = totalMembers > 0 ? parseFloat((amountValue / totalMembers).toFixed(2)) : 0;
        
        const newShares = members.map(member => ({
          userId: member.id,
          share: equalShare
        }));
        
        // Adjust the first share to account for rounding errors
        if (newShares.length > 0 && amount !== '') {
          const totalShares = newShares.reduce((sum, share) => sum + share.share, 0);
          const diff = parseFloat(amount) - totalShares;
          if (Math.abs(diff) > 0.01) {
            newShares[0].share = parseFloat((newShares[0].share + diff).toFixed(2));
          }
        }
        
        setShares(newShares);
      } else {
        setShares(members.map(member => ({
          userId: member.id,
          share: 0
        })));
      }
    }
  }, [selectedGroupId, amount, getGroupMembers, isEditing, expenseParticipants]);
  
  // Update equal shares when amount changes
  useEffect(() => {
    if (splitType === 'equal' && shares.length > 0 && amount !== '') {
      const amountValue = parseFloat(amount);
      const equalShare = shares.length > 0 ? parseFloat((amountValue / shares.length).toFixed(2)) : 0;
      
      const newShares = shares.map(share => ({
        ...share,
        share: equalShare
      }));
      
      // Adjust the first share to account for rounding errors
      const totalShares = newShares.reduce((sum, share) => sum + share.share, 0);
      const diff = amountValue - totalShares;
      if (Math.abs(diff) > 0.01) {
        newShares[0].share = parseFloat((newShares[0].share + diff).toFixed(2));
      }
      
      setShares(newShares);
    }
  }, [amount, splitType, shares.length, shares]);
  
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }
    
    if (!selectedGroupId) {
      newErrors.selectedGroupId = 'Please select a group';
    }
    
    if (!paidBy) {
      newErrors.paidBy = 'Please select who paid';
    }
    
    if (!date) {
      newErrors.date = 'Please select a date';
    }
    
    // Check if shares add up to the total amount
    if (amount && !isNaN(parseFloat(amount))) {
      const amountValue = parseFloat(amount);
      const totalShares = shares.reduce((sum, share) => sum + share.share, 0);
      
      if (Math.abs(totalShares - amountValue) > 0.01) {
        newErrors.shares = 'Shares must add up to the total amount';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    const expenseId = expense?.id || `expense-${Date.now()}`;
    const newExpense = {
      id: expenseId,
      groupId: selectedGroupId,
      description,
      amount: parseFloat(amount),
      paidBy,
      date: date.toISOString()
    };
    
    const newParticipants = shares.map(share => ({
      expenseId,
      userId: share.userId,
      share: share.share
    }));
    
    if (isEditing) {
      // Update existing expense
      setExpenses(prev => prev.map(e => e.id === expenseId ? newExpense : e));
      // Remove old participants and add new ones
      setExpenseParticipants(prev => [
        ...prev.filter(p => p.expenseId !== expenseId),
        ...newParticipants
      ]);
    } else {
      // Add new expense and participants
      setExpenses(prev => [...prev, newExpense]);
      setExpenseParticipants(prev => [...prev, ...newParticipants]);
    }
    
    // Navigate to the group page
    router.push(`/groups/${selectedGroupId}`);
  };
  
  const handleShareChange = (userId: string, value: string) => {
    const shareValue = value === '' ? 0 : parseFloat(value);
    
    setShares(prev => 
      prev.map(share => 
        share.userId === userId 
          ? { ...share, share: shareValue } 
          : share
      )
    );
    
    // If we're changing a share manually, switch to custom split
    setSplitType('custom');
  };
  
  const getUserName = (userId: string) => {
    const user = users.find(user => user.id === userId);
    return user ? user.name : 'Unknown';
  };
  
  const getUserAvatar = (userId: string) => {
    const user = users.find(user => user.id === userId);
    return user ? user.avatar : '';
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Expense' : 'New Expense'}</CardTitle>
        <CardDescription>
          {isEditing ? 'Update expense details' : 'Enter the details of your expense'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                placeholder="Dinner, Groceries, Rent, etc."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              {errors.description && (
                <p className="text-sm font-medium text-red-500">{errors.description}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount</label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              {errors.amount && (
                <p className="text-sm font-medium text-red-500">{errors.amount}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <DatePicker 
                value={date} 
                onChange={setDate} 
                placeholder="Select expense date"
              />
              {errors.date && (
                <p className="text-sm font-medium text-red-500">{errors.date}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Group</label>
              <select
                className="w-full px-3 py-2 border rounded-md"
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                disabled={isEditing} // Don't allow changing group when editing
              >
                <option value="">Select a group</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
              {errors.selectedGroupId && (
                <p className="text-sm font-medium text-red-500">{errors.selectedGroupId}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Paid by</label>
              <select
                className="w-full px-3 py-2 border rounded-md"
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
              >
                <option value="">Select who paid</option>
                {selectedGroupId ? 
                  getGroupMembers(selectedGroupId).map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  )) : 
                  <option value="" disabled>Select a group first</option>
                }
              </select>
              {errors.paidBy && (
                <p className="text-sm font-medium text-red-500">{errors.paidBy}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Split Type</label>
              <select
                className="w-full px-3 py-2 border rounded-md"
                value={splitType}
                onChange={(e) => setSplitType(e.target.value)}
              >
                <option value="equal">Equal Split</option>
                <option value="custom">Custom Split</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Split Details</label>
              <p className="text-sm text-gray-500">
                Specify how the expense will be split
              </p>
              
              {errors.shares && (
                <p className="text-sm font-medium text-red-500">{errors.shares}</p>
              )}
              
              <div className="space-y-2 mt-2">
                {shares.map((share) => (
                  <div key={share.userId} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={getUserAvatar(share.userId)}
                        alt={getUserName(share.userId)}
                      />
                      <AvatarFallback>{getUserName(share.userId).charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{getUserName(share.userId)}</p>
                    </div>
                    <div className="w-28">
                      <Input
                        type="number"
                        step="0.01"
                        value={share.share.toString()}
                        onChange={(e) => handleShareChange(share.userId, e.target.value)}
                        disabled={splitType === 'equal'}
                        className="text-right"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              type="button" 
              onClick={() => router.back()}
            >
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