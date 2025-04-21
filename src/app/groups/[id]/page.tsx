'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAppContext } from '@/context/AppContext';
import useExpenseCalculations from '@/hooks/useExpenseCalculations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';

export default function GroupDetails({ params }: { params: { id: string } }) {
  const { id: groupId } = params;
  const { groups, users, expenses } = useAppContext();
  const { 
    getGroupExpenses, 
    getGroupMembers, 
    calculateGroupBalances,
    calculateSimplifiedPayments
  } = useExpenseCalculations();
  
  const [activeTab, setActiveTab] = useState('expenses');
  
  const group = groups.find(g => g.id === groupId);
  
  if (!group) {
    return (
      <div className="container mx-auto py-8 max-w-6xl text-center">
        <h1 className="text-3xl font-bold mb-4">Group Not Found</h1>
        <p className="mb-6 text-gray-500">The group you're looking for doesn't exist.</p>
        <Button asChild>
          <Link href="/groups">Back to Groups</Link>
        </Button>
      </div>
    );
  }
  
  const groupExpenses = getGroupExpenses(groupId);
  const groupMembers = getGroupMembers(groupId);
  const balances = calculateGroupBalances(groupId);
  const simplifiedPayments = calculateSimplifiedPayments(groupId);
  
  const getCreatorName = (creatorId: string) => {
    const creator = users.find(user => user.id === creatorId);
    return creator ? creator.name : 'Unknown';
  };
  
  const getUserName = (userId: string) => {
    const user = users.find(user => user.id === userId);
    return user ? user.name : 'Unknown';
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  
  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/groups" className="hover:underline">Groups</Link>
          <span>/</span>
          <span>{group.name}</span>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{group.name}</h1>
            <p className="text-gray-500">{group.description}</p>
          </div>
          
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href={`/groups/${groupId}/edit`}>Edit Group</Link>
            </Button>
            <Button asChild>
              <Link href={`/expenses/new?groupId=${groupId}`}>Add Expense</Link>
            </Button>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Created By</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback>{getCreatorName(group.createdBy).charAt(0)}</AvatarFallback>
            </Avatar>
            <span>{getCreatorName(group.createdBy)}</span>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Date Created</CardTitle>
          </CardHeader>
          <CardContent>
            {formatDate(group.date)}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex -space-x-2">
              {groupMembers.map((member) => (
                <Avatar key={member.id} className="border-2 border-white">
                  <AvatarImage src={member.avatar} alt={member.name} />
                  <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                </Avatar>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="mb-6">
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="balances">Balances</TabsTrigger>
          <TabsTrigger value="settlements">Settlements</TabsTrigger>
        </TabsList>
        
        <TabsContent value="expenses">
          <div className="bg-white rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Paid By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupExpenses.length > 0 ? (
                  groupExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">{expense.description}</TableCell>
                      <TableCell>{formatAmount(expense.amount)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback>{getUserName(expense.paidBy).charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span>{getUserName(expense.paidBy)}</span>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(expense.date)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/expenses/${expense.id}`}>View</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500 h-24">
                      No expenses yet. Add one to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        
        <TabsContent value="balances">
          <Card>
            <CardHeader>
              <CardTitle>Current Balances</CardTitle>
              <CardDescription>
                See who owes what in this group
              </CardDescription>
            </CardHeader>
            <CardContent>
              {balances.length > 0 ? (
                <div className="space-y-4">
                  {balances.map((balance) => (
                    <div 
                      key={balance.userId} 
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{balance.userName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span>{balance.userName}</span>
                      </div>
                      <div 
                        className={`font-semibold ${
                          balance.amount > 0 
                            ? 'text-green-600' 
                            : balance.amount < 0 
                              ? 'text-red-600' 
                              : ''
                        }`}
                      >
                        {balance.amount > 0 
                          ? `Gets back ${formatAmount(balance.amount)}` 
                          : balance.amount < 0 
                            ? `Owes ${formatAmount(Math.abs(balance.amount))}`
                            : 'Settled up'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No balances to show. Add expenses to see balances.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settlements">
          <Card>
            <CardHeader>
              <CardTitle>Suggested Settlements</CardTitle>
              <CardDescription>
                Simplified payments to settle all debts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {simplifiedPayments.length > 0 ? (
                <div className="space-y-4">
                  {simplifiedPayments.map((payment, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback>{payment.fromName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span>{payment.fromName}</span>
                        </div>
                      </div>
                      <div className="flex-1 text-center">
                        <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-sm">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="mr-1 text-gray-600"
                          >
                            <path d="M6 12h12"></path>
                            <path d="M12 18V6"></path>
                          </svg>
                          <span>{formatAmount(payment.amount)}</span>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="ml-1 text-gray-600"
                          >
                            <path d="M5 12h14"></path>
                            <path d="M12 5l7 7-7 7"></path>
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span>{payment.toName}</span>
                          <Avatar className="h-6 w-6">
                            <AvatarFallback>{payment.toName.charAt(0)}</AvatarFallback>
                          </Avatar>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No settlements needed. Everyone is settled up!
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 