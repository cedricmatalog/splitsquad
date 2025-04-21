'use client';

import { useAppContext } from '@/context/AppContext';
import useExpenseCalculations from '@/hooks/useExpenseCalculations';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function Dashboard() {
  const { groups, currentUser } = useAppContext();
  const { calculateUserTotalBalance } = useExpenseCalculations();
  
  const userBalance = calculateUserTotalBalance();
  const userGroups = groups.slice(0, 4); // Show only 4 groups for now
  
  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-gray-500">Manage your expenses and groups</p>
        </div>
        
        {currentUser && (
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-500">Signed in as</p>
              <p className="font-medium">{currentUser.name}</p>
            </div>
            <Avatar>
              <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
              <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
            </Avatar>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Your Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${userBalance > 0 ? 'text-green-600' : userBalance < 0 ? 'text-red-600' : ''}`}>
              ${Math.abs(userBalance).toFixed(2)}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {userBalance > 0 ? 'You are owed' : userBalance < 0 ? 'You owe' : 'All settled up'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Groups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {groups.length}
            </div>
            <p className="text-sm text-gray-500 mt-1">Active expense groups</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full" size="sm">
              <Link href="/expenses/new">Add Expense</Link>
            </Button>
            <Button className="w-full" variant="outline" size="sm">
              <Link href="/groups/new">Create Group</Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">Recent transactions will appear here</p>
          </CardContent>
        </Card>
      </div>
      
      <h2 className="text-2xl font-bold mb-4">Your Groups</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {userGroups.map((group) => (
          <Card key={group.id}>
            <CardHeader>
              <CardTitle>{group.name}</CardTitle>
              <CardDescription>{group.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Created: {new Date(group.date).toLocaleDateString()}
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full">
                <Link href={`/groups/${group.id}`}>View Details</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
        
        <Card className="flex items-center justify-center">
          <CardContent className="text-center p-6">
            <div className="mb-4 w-12 h-12 mx-auto rounded-full bg-gray-100 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                <path d="M12 5v14M5 12h14"></path>
              </svg>
            </div>
            <h3 className="font-semibold mb-2">Create New Group</h3>
            <p className="text-sm text-gray-500 mb-4">Start tracking expenses with friends</p>
            <Button asChild>
              <Link href="/groups/new">Create Group</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 