'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAppContext } from '@/context/AppContext';
import useExpenseCalculations from '@/hooks/useExpenseCalculations';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';

export default function Groups() {
  const { groups, users } = useAppContext();
  const { getGroupMembers } = useExpenseCalculations();
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredGroups = groups.filter(
    group => group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             group.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const getCreatorName = (creatorId: string) => {
    const creator = users.find(user => user.id === creatorId);
    return creator ? creator.name : 'Unknown';
  };
  
  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Groups</h1>
          <p className="text-gray-500">Manage your expense groups</p>
        </div>
        
        <Button asChild>
          <Link href="/groups/new">
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
              className="mr-2"
            >
              <path d="M12 5v14M5 12h14"></path>
            </svg>
            Create New Group
          </Link>
        </Button>
      </div>
      
      <div className="mb-6">
        <Input
          type="text"
          placeholder="Search groups..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGroups.length > 0 ? (
          filteredGroups.map((group) => {
            const members = getGroupMembers(group.id);
            
            return (
              <Card key={group.id}>
                <CardHeader>
                  <CardTitle>{group.name}</CardTitle>
                  <CardDescription>{group.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="text-gray-500">Created by:</span> {getCreatorName(group.createdBy)}
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500">Created on:</span> {new Date(group.date).toLocaleDateString()}
                    </div>
                    <div className="mt-4">
                      <p className="text-sm text-gray-500 mb-2">Members:</p>
                      <div className="flex -space-x-2">
                        {members.slice(0, 5).map((member) => (
                          <Avatar key={member.id} className="border-2 border-white">
                            <AvatarImage src={member.avatar} alt={member.name} />
                            <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                        ))}
                        {members.length > 5 && (
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 border-2 border-white text-xs font-medium">
                            +{members.length - 5}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/groups/${group.id}`}>View Details</Link>
                  </Button>
                </CardFooter>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500">No groups found. Create a new group to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
} 