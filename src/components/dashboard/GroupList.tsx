'use client';

import Link from 'next/link';
import { Group } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface GroupListProps {
  groups: Group[];
  limit?: number;
}

export function GroupList({ groups, limit }: GroupListProps) {
  const displayGroups = limit ? groups.slice(0, limit) : groups;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Your Groups</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {displayGroups.map(group => (
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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gray-500"
              >
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
