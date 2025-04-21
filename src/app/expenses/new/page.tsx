'use client';

import { useState, useEffect } from 'react';
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function NewExpense() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedGroupId = searchParams.get('groupId');
  
  const { groups, users, expenses, expenseParticipants, setExpenses, setExpenseParticipants, currentUser } = useAppContext();
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
  
  const getGroupName = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    return group ? group.name : 'Unknown Group';
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
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Dinner, Groceries, Rent, etc."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </FormControl>
                {errors.description && (
                  <FormMessage>{errors.description}</FormMessage>
                )}
              </FormItem>
              
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </FormControl>
                {errors.amount && (
                  <FormMessage>{errors.amount}</FormMessage>
                )}
              </FormItem>
              
              <FormItem>
                <FormLabel>Group</FormLabel>
                <Select
                  value={selectedGroupId}
                  onValueChange={setSelectedGroupId}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a group" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.selectedGroupId && (
                  <FormMessage>{errors.selectedGroupId}</FormMessage>
                )}
              </FormItem>
              
              <FormItem>
                <FormLabel>Paid by</FormLabel>
                <Select
                  value={paidBy}
                  onValueChange={setPaidBy}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select who paid" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {selectedGroupId ? 
                      getGroupMembers(selectedGroupId).map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={user.avatar} alt={user.name} />
                              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span>{user.name}</span>
                          </div>
                        </SelectItem>
                      )) : 
                      <SelectItem value="" disabled>Select a group first</SelectItem>
                    }
                  </SelectContent>
                </Select>
                {errors.paidBy && (
                  <FormMessage>{errors.paidBy}</FormMessage>
                )}
              </FormItem>
              
              <FormItem>
                <FormLabel>Split Type</FormLabel>
                <Select
                  value={splitType}
                  onValueChange={setSplitType}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="How to split the expense" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="equal">Equal Split</SelectItem>
                    <SelectItem value="custom">Custom Split</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
              
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
                    <FormMessage>{errors.shares}</FormMessage>
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