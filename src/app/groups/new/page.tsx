'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import { PageHeader } from '@/components/PageHeader';
import { GroupForm } from '@/components/groups/GroupForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { createGroupMember } from '@/services/group_members';

export default function NewGroup() {
  const router = useRouter();
  const { users, setGroups, setGroupMembers, currentUser } = useAppContext();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async ({
    name,
    description,
    members,
    id: createdGroupId,
  }: {
    name: string;
    description: string;
    members: string[];
    id: string;
  }) => {
    if (!currentUser) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Add the new group to the context state
      setGroups(prevGroups => [
        ...prevGroups,
        {
          id: createdGroupId,
          name,
          description,
          createdBy: currentUser.id,
          date: new Date().toISOString(),
        },
      ]);

      const memberPromises = members.map(userId =>
        createGroupMember({ userId, groupId: createdGroupId })
      );

      const createdMembers = await Promise.all(memberPromises);

      if (createdMembers.some(m => m === null)) {
        throw new Error('Failed to add some members to the group');
      }

      setGroupMembers(prev => [...prev, ...createdMembers.filter(m => m !== null)]);

      router.push(`/groups/${createdGroupId}`);
    } catch (error) {
      console.error('Error adding members to group:', error);
      alert('Group created, but failed to add members. Please add them manually.');
      router.push(`/groups/${createdGroupId}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <PageHeader
        title="Create New Group"
        description="Set up a new group to track shared expenses"
        breadcrumbs={[{ label: 'Groups', href: '/groups' }, { label: 'New Group' }]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Group Details</CardTitle>
          <CardDescription>Fill out the information to create your new group</CardDescription>
        </CardHeader>
        <CardContent>
          <GroupForm
            users={users}
            currentUserId={currentUser?.id}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </CardContent>
      </Card>
    </div>
  );
}
