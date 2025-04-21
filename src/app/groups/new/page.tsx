'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import { PageHeader } from '@/components/PageHeader';
import { GroupForm } from '@/components/groups/GroupForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function NewGroup() {
  const router = useRouter();
  const { users, setGroups, setGroupMembers, currentUser } = useAppContext();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = ({
    name,
    description,
    members,
  }: {
    name: string;
    description: string;
    members: string[];
  }) => {
    if (!currentUser) {
      return;
    }

    setIsSubmitting(true);

    const newGroupId = `group-${Date.now()}`;
    const newGroup = {
      id: newGroupId,
      name,
      description,
      createdBy: currentUser.id,
      date: new Date().toISOString(),
    };

    const newGroupMembers = members.map(userId => ({
      userId,
      groupId: newGroupId,
    }));

    // Add new group and members
    setGroups(prev => [...prev, newGroup]);
    setGroupMembers(prev => [...prev, ...newGroupMembers]);

    // Navigate to the new group page
    router.push(`/groups/${newGroupId}`);
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
