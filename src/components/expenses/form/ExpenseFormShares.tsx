'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui';

interface ShareProps {
  userId: string;
  userName: string;
  userAvatar?: string;
  share: number;
  totalAmount: number;
  splitType: string;
  onShareChange: (userId: string, value: string) => void;
  onMemberToggle: (userId: string, isEnabled: boolean) => void;
}

export function ExpenseFormShares({
  userId,
  userName,
  userAvatar,
  share,
  totalAmount,
  splitType,
  onShareChange,
  onMemberToggle,
}: ShareProps) {
  const [isEnabled, setIsEnabled] = useState(share > 0);
  const percentage = totalAmount > 0 ? (share / totalAmount) * 100 : 0;

  const handleToggle = () => {
    const newIsEnabled = !isEnabled;
    setIsEnabled(newIsEnabled);
    onMemberToggle(userId, newIsEnabled);
  };

  return (
    <div className="flex items-center gap-3 p-3 border rounded-md">
      <div className="flex-shrink-0">
        <Avatar className="h-9 w-9">
          <AvatarImage src={userAvatar} alt={userName} />
          <AvatarFallback className="bg-primary/10 text-primary font-medium">
            {userName.charAt(0)}
          </AvatarFallback>
        </Avatar>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{userName}</p>
        {splitType === 'equal' ? (
          <div className="flex items-center gap-2 mt-1">
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={handleToggle}
              className="rounded text-primary focus:ring-primary"
            />
            <span className="text-xs text-gray-500">
              {isEnabled ? `$${share.toFixed(2)} (${percentage.toFixed(0)}%)` : 'Excluded'}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 mt-1">
            <div className="relative w-full">
              <input
                type="number"
                value={share || ''}
                onChange={e => onShareChange(userId, e.target.value)}
                step="0.01"
                min="0"
                className="pl-6 py-1 text-sm border rounded w-full"
              />
              <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">
                $
              </span>
            </div>
            <span className="text-xs text-gray-500 w-12">
              {percentage > 0 ? `${percentage.toFixed(0)}%` : '0%'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
