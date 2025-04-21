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
import { Users, Calendar, ArrowRight, PlusCircle } from 'lucide-react';

interface GroupListProps {
  groups: Group[];
  limit?: number;
}

export function GroupList({ groups, limit }: GroupListProps) {
  const displayGroups = limit ? groups.slice(0, limit) : groups;

  return (
    <div className="animate-fade-in">
      {!limit && <h2 className="text-2xl font-bold mb-4">Your Groups</h2>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {displayGroups.map(group => (
          <Card
            key={group.id}
            className="border hover:shadow-md transition-all duration-200 overflow-hidden"
          >
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{group.name}</CardTitle>
                  <CardDescription className="line-clamp-2 mt-1">
                    {group.description || 'No description'}
                  </CardDescription>
                </div>
                <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users size={16} className="text-primary" />
                </span>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="flex items-center text-sm text-gray-500 gap-1">
                <Calendar size={14} />
                <span>Created: {new Date(group.date).toLocaleDateString()}</span>
              </div>
            </CardContent>
            <CardFooter className="pt-0 border-t bg-gray-50">
              <Button
                asChild
                variant="ghost"
                className="w-full text-primary hover:text-primary-foreground hover:bg-primary"
              >
                <Link
                  href={`/groups/${group.id}`}
                  className="flex items-center justify-center gap-1"
                >
                  View Details
                  <ArrowRight size={14} />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}

        <Card className="border-dashed border-2 hover:border-primary/50 transition-colors duration-200 flex items-center justify-center bg-transparent hover:bg-primary/5">
          <CardContent className="text-center p-6">
            <div className="mb-4 w-14 h-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <PlusCircle size={24} className="text-primary" />
            </div>
            <h3 className="font-semibold mb-2 text-gray-800">Create New Group</h3>
            <p className="text-sm text-gray-500 mb-4">Start tracking expenses with friends</p>
            <Button asChild className="gap-2">
              <Link href="/groups/new">
                <PlusCircle size={16} />
                Create Group
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
