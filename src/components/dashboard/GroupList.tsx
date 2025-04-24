'use client';

import Link from 'next/link';
import { Group } from '@/types';
import { Button } from '@/components/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import { Users, Calendar, ArrowRight, PlusCircle } from 'lucide-react';

interface GroupListProps {
  /** An array of Group objects to display. */
  groups: Group[];
  /** Optional limit for the number of groups to display. */
  limit?: number;
}

/**
 * Renders a list of group cards.
 *
 * Displays group information in Card components.
 * Handles horizontal scrolling on mobile viewports and grid layout on larger screens.
 * Shows a "Create New Group" card at the end of the list.
 *
 * @param {GroupListProps} props - The component props.
 * @param {Group[]} props.groups - An array of Group objects to display.
 * @param {number} [props.limit] - Optional limit for the number of groups to display.
 */
export function GroupList({ groups, limit }: GroupListProps) {
  const displayGroups = limit ? groups.slice(0, limit) : groups;

  return (
    <div className="animate-fade-in">
      {!limit && <h2 className="text-2xl font-bold mb-4">Your Groups</h2>}

      {/* On mobile: horizontal scrolling, on desktop: grid */}
      <div
        className={`
        ${limit ? 'md:grid md:grid-cols-4 gap-6' : 'md:grid md:grid-cols-2 lg:grid-cols-4 gap-6'} 
        flex flex-nowrap overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0 md:overflow-x-visible md:pb-0
        scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent
      `}
      >
        {displayGroups.map(group => (
          <Card
            key={group.id}
            className="border border-gray-200 hover:shadow-md transition-all duration-200 h-full flex flex-col
              flex-shrink-0 w-[85%] sm:w-[45%] md:w-full mr-4 md:mr-0 rounded-lg overflow-hidden"
          >
            <CardHeader className="pb-3 pt-3">
              <div className="flex justify-between items-start">
                <div className="min-w-0 flex-1 pr-2">
                  <CardTitle className="text-lg font-semibold truncate">{group.name}</CardTitle>
                  <CardDescription className="line-clamp-2 mt-1 text-sm break-words h-10 text-gray-600">
                    {group.description || 'No description'}
                  </CardDescription>
                </div>
                <span className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Users size={16} className="text-blue-600" />
                </span>
              </div>
            </CardHeader>
            <CardContent className="pb-4 flex-grow">
              <div className="flex items-center text-sm text-gray-500 gap-1">
                <Calendar size={14} className="flex-shrink-0" />
                <span className="truncate">
                  Created: {new Date(group.date).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
            <CardFooter className="pt-3 pb-3 border-t  mt-auto">
              <Button
                asChild
                variant="ghost"
                className="w-full text-blue-600 hover:text-white hover:bg-blue-600"
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

        <Card
          className="border border-dashed border-gray-300 hover:border-blue-400 transition-colors duration-200 
          flex flex-col items-center justify-center bg-white hover:bg-blue-50/30 h-full
          flex-shrink-0 w-[85%] sm:w-[45%] md:w-full mr-4 md:mr-0 rounded-lg"
        >
          <CardContent className="text-center p-6 flex flex-col h-full justify-center">
            <div className="mb-4 w-14 h-14 mx-auto rounded-full bg-blue-50 flex items-center justify-center">
              <PlusCircle size={24} className="text-blue-600" />
            </div>
            <h3 className="font-semibold mb-2 text-gray-800 truncate max-w-full">
              Create New Group
            </h3>
            <p className="text-sm text-gray-500 mb-4 line-clamp-2 h-10">
              Start tracking expenses with friends
            </p>
            <Button asChild className="gap-2 mt-auto bg-blue-600 hover:bg-blue-700">
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
