'use client';

import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui';
import React from 'react';

interface ShareDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  shareUrlRef: React.RefObject<HTMLInputElement | null>;
  handleCopyShareLink: () => Promise<void>;
  copySuccess: boolean;
}

export function ShareDialog({
  isOpen,
  onOpenChange,
  groupId,
  shareUrlRef,
  handleCopyShareLink,
  copySuccess,
}: ShareDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Group</DialogTitle>
          <DialogDescription>
            Share this link with friends to give them access to the group
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium">Direct Link</label>
            <div className="flex space-x-2">
              <Input
                ref={shareUrlRef}
                value={`${window.location.origin}/groups/${groupId}`}
                readOnly
                aria-label="Share URL"
              />
              <Button
                onClick={handleCopyShareLink}
                disabled={copySuccess}
                aria-label="Copy share link to clipboard"
              >
                {copySuccess ? (
                  <div className="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-green-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>Copied!</span>
                  </div>
                ) : (
                  'Copy'
                )}
              </Button>
            </div>
            <p className="text-sm text-gray-500">
              Anyone with this link can view and join the group
            </p>
          </div>

          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium">Invite via Email</label>
            <div className="flex space-x-2">
              <Input placeholder="email@example.com" />
              <Button variant="outline">Send</Button>
            </div>
            <p className="text-sm text-gray-500">Enter email addresses separated by commas</p>
          </div>
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
