'use client';

import { useState } from 'react';
import { User } from '@/types';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface GroupFormProps {
  users: User[];
  currentUserId: string | undefined;
  onSubmit: (formData: { name: string; description: string; members: string[] }) => void;
  isSubmitting: boolean;
}

export function GroupForm({ users, currentUserId, onSubmit, isSubmitting }: GroupFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>(
    currentUserId ? [currentUserId] : []
  );
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

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

    if (!validateForm()) {
      return;
    }

    onSubmit({
      name,
      description,
      members: selectedMembers,
    });
  };

  const toggleMember = (userId: string) => {
    setSelectedMembers(prev => {
      if (prev.includes(userId)) {
        // Don't allow removing yourself from the group
        if (userId === currentUserId) {
          return prev;
        }
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Group Name</label>
          <Input
            placeholder="Summer Trip, Apartment, etc."
            value={name}
            onChange={e => setName(e.target.value)}
          />
          {errors.name && <p className="text-sm font-medium text-red-500">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Description</label>
          <Input
            placeholder="Brief description of the group"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
          {errors.description && (
            <p className="text-sm font-medium text-red-500">{errors.description}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Group Members</label>
          <p className="text-sm text-gray-500">Select who will be part of this group</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
            {users.map(user => {
              const isSelected = selectedMembers.includes(user.id);
              const isCurrentUser = user.id === currentUserId;

              return (
                <div
                  key={user.id}
                  data-testid={`user-checkbox-${user.id}`}
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

          {errors.members && <p className="text-sm font-medium text-red-500">{errors.members}</p>}
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" type="button" asChild>
          <Link href="/groups">Cancel</Link>
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Group'}
        </Button>
      </div>
    </form>
  );
}
