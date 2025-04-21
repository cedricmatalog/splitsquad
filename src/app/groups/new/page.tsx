'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function NewGroup() {
  const router = useRouter();
  const { users, setGroups, setGroupMembers, currentUser } = useAppContext();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>(
    currentUser ? [currentUser.id] : []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!name.trim()) {
      newErrors.name = 'Group name is required';
    }
    
    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (selectedMembers.length < 1) {
      newErrors.members = 'Please select at least one member';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !currentUser) {
      return;
    }
    
    setIsSubmitting(true);
    
    const newGroupId = `group-${Date.now()}`;
    const newGroup = {
      id: newGroupId,
      name,
      description,
      createdBy: currentUser.id,
      date: new Date().toISOString()
    };
    
    const newGroupMembers = selectedMembers.map(userId => ({
      userId,
      groupId: newGroupId
    }));
    
    // Add new group and members
    setGroups(prev => [...prev, newGroup]);
    setGroupMembers(prev => [...prev, ...newGroupMembers]);
    
    // Navigate to the new group page
    router.push(`/groups/${newGroupId}`);
  };
  
  const toggleMember = (userId: string) => {
    setSelectedMembers(prev => {
      if (prev.includes(userId)) {
        // Don't allow removing yourself from the group
        if (userId === currentUser?.id) {
          return prev;
        }
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };
  
  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/groups" className="hover:underline">Groups</Link>
          <span>/</span>
          <span>New Group</span>
        </div>
        
        <h1 className="text-3xl font-bold mb-2">Create New Group</h1>
        <p className="text-gray-500">
          Set up a new group to track shared expenses
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Group Details</CardTitle>
          <CardDescription>
            Fill out the information to create your new group
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Group Name</label>
                <Input
                  placeholder="Summer Trip, Apartment, etc."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                {errors.name && (
                  <p className="text-sm font-medium text-red-500">{errors.name}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input
                  placeholder="Brief description of the group"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                {errors.description && (
                  <p className="text-sm font-medium text-red-500">{errors.description}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Group Members</label>
                <p className="text-sm text-gray-500">
                  Select who will be part of this group
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  {users.map((user) => {
                    const isSelected = selectedMembers.includes(user.id);
                    const isCurrentUser = user.id === currentUser?.id;
                    
                    return (
                      <div 
                        key={user.id}
                        className={`
                          flex items-center gap-3 p-3 rounded-lg border cursor-pointer
                          ${isSelected ? 'bg-primary/10 border-primary' : 'hover:bg-gray-50'}
                          ${isCurrentUser ? 'opacity-70' : ''}
                        `}
                        onClick={() => toggleMember(user.id)}
                      >
                        <Avatar>
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                        <div className="w-5 h-5 rounded-full border flex items-center justify-center">
                          {isSelected && (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-primary"
                            >
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {errors.members && (
                  <p className="text-sm font-medium text-red-500">{errors.members}</p>
                )}
              </div>
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
                Create Group
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 