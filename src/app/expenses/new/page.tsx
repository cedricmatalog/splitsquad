'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAppContext } from '@/context/AppContext';
import useExpenseCalculations from '@/hooks/useExpenseCalculations';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

function NewExpenseForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedGroupId = searchParams.get('groupId');
  
  const { groups, users, setExpenses, setExpenseParticipants, currentUser } = useAppContext();
  const { getGroupMembers } = useExpenseCalculations();
  
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState(preSelectedGroupId || '');
  const [paidBy, setPaidBy] = useState(currentUser?.id || '');
  const [splitType, setSplitType] = useState('equal'); // equal, custom
  const [shares, setShares] = useState<{userId: string, share: number}[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  // When selectedGroupId changes, update shares based on group members
  useEffect(() => {
    if (selectedGroupId) {
      const members = getGroupMembers(selectedGroupId);
      const totalMembers = members.length;
      
      if (totalMembers > 0 && amount !== '') {
        const amountValue = parseFloat(amount);
        const equalShare = totalMembers > 0 ? amountValue / totalMembers : 0;
        
        const newShares = members.map(member => ({
          userId: member.id,
          share: equalShare
        }));
        
        setShares(newShares);
      } else {
        setShares(members.map(member => ({
          userId: member.id,
          share: 0
        })));
      }
    }
  }, [selectedGroupId, amount, getGroupMembers]);
  
  // Update equal shares when amount changes
  useEffect(() => {
    if (splitType === 'equal' && shares.length > 0 && amount !== '') {
      const amountValue = parseFloat(amount);
      const equalShare = shares.length > 0 ? amountValue / shares.length : 0;
      
      setShares(prev => prev.map(share => ({
        ...share,
        share: equalShare
      })));
    }
  }, [amount, splitType, shares.length]);
  
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
    
    const newExpenseId = `expense-${Date.now()}`;
    const newExpense = {
      id: newExpenseId,
      groupId: selectedGroupId,
      description,
      amount: parseFloat(amount),
      paidBy,
      date: new Date().toISOString()
    };
    
    const newParticipants = shares.map(share => ({
      expenseId: newExpenseId,
      userId: share.userId,
      share: share.share
    }));
    
    // Add new expense and participants
    setExpenses(prev => [...prev, newExpense]);
    setExpenseParticipants(prev => [...prev, ...newParticipants]);
    
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
  };
  
  const getUserName = (userId: string) => {
    const user = users.find(user => user.id === userId);
    return user ? user.name : 'Unknown';
  };
  
  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/expenses" className="hover:underline">Expenses</Link>
          <span>/</span>
          <span>New Expense</span>
        </div>
        
        <h1 className="text-3xl font-bold mb-2">Add New Expense</h1>
        <p className="text-gray-500">Create a new expense to split with your group</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Expense Details</CardTitle>
          <CardDescription>
            Fill out the information about this expense
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
                <label className="text-sm font-medium">Group</label>
                <select
                  className="w-full px-3 py-2 border rounded-md"
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
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
              
              {selectedGroupId && (
                <div className="border rounded-lg p-4 space-y-4">
                  <h3 className="font-medium">Share Allocation</h3>
                  
                  {shares.map((share) => (
                    <div key={share.userId} className="flex items-center gap-4">
                      <div className="flex items-center gap-2 flex-1">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{getUserName(share.userId).charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span>{getUserName(share.userId)}</span>
                      </div>
                      
                      {splitType === 'custom' ? (
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={share.share === 0 ? '' : share.share.toString()}
                          onChange={(e) => handleShareChange(share.userId, e.target.value)}
                          className="w-24"
                        />
                      ) : (
                        <div className="w-24 text-right">
                          {share.share.toFixed(2)}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {errors.shares && (
                    <p className="text-sm font-medium text-red-500">{errors.shares}</p>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                type="button" 
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                Create Expense
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function NewExpensePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewExpenseForm />
    </Suspense>
  );
} 