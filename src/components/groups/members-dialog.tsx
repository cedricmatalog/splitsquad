'use client';

import { Button } from '@/components/ui';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui';
import { User } from '@/types';

interface MembersDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  groupMembers: User[];
  groupName: string;
  groupCreatorId?: string;
}

export function MembersDialog({
  isOpen,
  onOpenChange,
  groupMembers,
  groupName,
  groupCreatorId,
}: MembersDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Group Members</DialogTitle>
          <DialogDescription>People participating in {groupName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {groupMembers.map(member => (
            <div
              key={member.id}
              className="flex items-center justify-between py-2 border-b last:border-0"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={member.avatar} alt={member.name} />
                  <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{member.name}</p>
                  <p className="text-sm text-gray-500">{member.email}</p>
                </div>
              </div>

              {groupCreatorId && member.id === groupCreatorId && (
                <div className="text-sm bg-gray-100 px-2 py-1 rounded">Admin</div>
              )}
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
