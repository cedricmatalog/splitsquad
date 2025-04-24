'use client';

import { Button } from '@/components/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';

interface GroupJoinPromptProps {
  handleJoinGroup: () => Promise<void>;
}

export function GroupJoinPrompt({ handleJoinGroup }: GroupJoinPromptProps) {
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Join This Group</CardTitle>
        <CardDescription>Join this group to see expenses and balances</CardDescription>
      </CardHeader>
      <CardContent className="text-center py-6">
        <p className="mb-4 text-gray-500">
          You need to join this group to see expenses and balances.
        </p>
        <Button onClick={handleJoinGroup}>Join Group</Button>
      </CardContent>
    </Card>
  );
}
