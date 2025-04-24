'use client';

import { Button } from '@/components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui';
import { Group, User } from '@/types';

interface GroupInfoCardsProps {
  group: Group;
  groupMembers: User[];
  getCreatorName: (creatorId: string) => string;
  getCreatorAvatar: (creatorId: string) => string;
  formatDate: (dateString: string) => string;
  onViewAllMembersClick: () => void;
}

export function GroupInfoCards({
  group,
  groupMembers,
  getCreatorName,
  getCreatorAvatar,
  formatDate,
  onViewAllMembersClick,
}: GroupInfoCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">Created By</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage
              src={getCreatorAvatar(group.createdBy)}
              alt={getCreatorName(group.createdBy)}
            />
            <AvatarFallback>{getCreatorName(group.createdBy).charAt(0)}</AvatarFallback>
          </Avatar>
          <span>{getCreatorName(group.createdBy)}</span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">Date Created</CardTitle>
        </CardHeader>
        <CardContent>{formatDate(group.date)}</CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-500">Members</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-6 px-2"
            onClick={onViewAllMembersClick}
          >
            View All
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex -space-x-2">
            {groupMembers.slice(0, 5).map(member => (
              <Avatar key={member.id} className="border-2 border-white">
                <AvatarImage src={member.avatar} alt={member.name} />
                <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
              </Avatar>
            ))}
            {groupMembers.length > 5 && (
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 border-2 border-white text-xs font-medium">
                +{groupMembers.length - 5}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
