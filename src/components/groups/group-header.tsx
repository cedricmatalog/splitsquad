'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Group } from '@/types';

interface GroupHeaderProps {
  group: Group;
  isUserMember: boolean;
  onShareClick: () => void;
  handleJoinGroup: () => Promise<void>;
  isJoining: boolean;
}

export function GroupHeader({
  group,
  isUserMember,
  onShareClick,
  handleJoinGroup,
  isJoining,
}: GroupHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
        <Link href="/groups" className="hover:underline">
          Groups
        </Link>
        <span>/</span>
        <span>{group.name}</span>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">{group.name}</h1>
          <p className="text-gray-500">{group.description}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {isUserMember ? (
            <>
              <Button variant="outline" onClick={onShareClick}>
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
                  <circle cx="18" cy="5" r="3"></circle>
                  <circle cx="6" cy="12" r="3"></circle>
                  <circle cx="18" cy="19" r="3"></circle>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                </svg>
                Share Group
              </Button>
              <Button asChild variant="outline">
                <Link href={`/groups/${group.id}/edit`}>Edit Group</Link>
              </Button>
              <Button asChild>
                <Link href={`/expenses/new?groupId=${group.id}`}>Add Expense</Link>
              </Button>
            </>
          ) : (
            <Button onClick={handleJoinGroup} disabled={isJoining}>
              {isJoining ? (
                <>
                  <Spinner /> Joining...
                </>
              ) : (
                'Join Group'
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
