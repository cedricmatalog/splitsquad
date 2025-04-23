'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import useExpenseCalculations from '@/hooks/useExpenseCalculations';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/PageHeader';
import { PlusCircle, Users, Calendar } from 'lucide-react';

export default function Groups() {
  const { groups, groupMembers, currentUser, isLoading: contextLoading } = useAppContext();
  const { getGroupMembers } = useExpenseCalculations();
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  // Redirect to login if user is not authenticated
  useEffect(() => {
    if (!contextLoading) {
      if (!currentUser) {
        // Save current URL for redirection after login
        if (typeof window !== 'undefined') {
          localStorage.setItem('redirectAfterLogin', window.location.pathname);
        }
        router.push('/login');
      } else {
        setIsLoading(false);
      }
    }
  }, [currentUser, router, contextLoading]);

  // Filter groups to only show those the user is a member of or created
  const userGroups = groups.filter(
    group =>
      // User created the group
      (currentUser && group.createdBy === currentUser.id) ||
      // User is a member of the group
      (currentUser &&
        groupMembers.some(
          member => member.userId === currentUser.id && member.groupId === group.id
        ))
  );

  // Then apply the search filter
  const filteredGroups = userGroups.filter(
    group =>
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (contextLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 sm:py-8 px-4 sm:px-6 max-w-6xl">
      <PageHeader
        title="My Groups"
        description="Manage your expense groups"
        action={
          <Button asChild className="whitespace-nowrap">
            <Link href="/groups/new" className="flex items-center gap-2">
              <PlusCircle size={16} />
              <span className="hidden sm:inline">Create New Group</span>
              <span className="sm:hidden">New Group</span>
            </Link>
          </Button>
        }
      />

      <div className="mb-6">
        <Input
          type="text"
          placeholder="Search groups..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredGroups.length > 0 ? (
          filteredGroups.map(group => {
            const members = getGroupMembers(group.id);

            return (
              <Card
                key={group.id}
                className="border hover:shadow-md transition-all duration-200 overflow-hidden"
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg line-clamp-1">{group.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {group.description}
                      </CardDescription>
                    </div>
                    <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users size={16} className="text-primary" />
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="space-y-2">
                    <div className="text-sm flex items-center gap-1">
                      <Calendar size={14} className="text-gray-500" />
                      <span className="text-gray-500">Created:</span>{' '}
                      {new Date(group.date).toLocaleDateString()}
                    </div>
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 mb-2">Members:</p>
                      <div className="flex -space-x-2 overflow-hidden">
                        {members.slice(0, 5).map(member => (
                          <Avatar key={member.id} className="border-2 border-white h-7 w-7">
                            <AvatarImage src={member.avatar} alt={member.name} />
                            <AvatarFallback className="text-xs">
                              {member.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {members.length > 5 && (
                          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-200 border-2 border-white text-xs font-medium">
                            +{members.length - 5}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0 border-t ">
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
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full text-center py-12">
            <div className="mb-4 w-14 h-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <Users size={24} className="text-primary" />
            </div>
            <h3 className="font-semibold mb-2 text-gray-800">No Groups Found</h3>
            <p className="text-sm text-gray-500 mb-4">
              {searchTerm
                ? 'No groups match your search. Try different keywords.'
                : "You aren't a member of any groups yet. Create a new group to get started."}
            </p>
            <Button asChild className="gap-2">
              <Link href="/groups/new">
                <PlusCircle size={16} />
                Create Group
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* Mobile floating action button for quick group creation */}
      <div className="fixed right-4 bottom-20 md:hidden">
        <Button size="lg" className="h-14 w-14 rounded-full shadow-lg" asChild>
          <Link href="/groups/new" aria-label="Add new group">
            <PlusCircle size={24} />
          </Link>
        </Button>
      </div>
    </div>
  );
}
