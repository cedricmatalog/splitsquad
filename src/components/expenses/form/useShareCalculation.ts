'use client';

import { useState, useCallback } from 'react';
import { calculateEqualShares } from './ExpenseFormCalculations';

interface Share {
  userId: string;
  share: number;
}

export function useShareCalculation(initialShares: Share[] = []) {
  const [shares, setShares] = useState<Share[]>(initialShares);
  const [splitType, setSplitType] = useState<'equal' | 'custom'>('equal');

  // Recalculate shares when amount changes
  const recalculateShares = useCallback(
    (memberIds: string[], amount: number) => {
      if (isNaN(amount) || amount <= 0) return;

      if (splitType === 'equal') {
        // Get currently active members
        const activeMembers = shares.filter(share => share.share > 0).map(share => share.userId);

        // If no members are active (first load), use all members
        const membersToUse = activeMembers.length > 0 ? activeMembers : memberIds;

        const equalShares = calculateEqualShares(membersToUse, amount);

        // Apply the equal shares but maintain excluded members
        const updatedShares = memberIds.map(memberId => {
          const existingShare = shares.find(s => s.userId === memberId);

          // If this member was active or we're starting fresh, update their share
          if ((existingShare && existingShare.share > 0) || activeMembers.length === 0) {
            const equalShare = equalShares.find(s => s.userId === memberId);
            return equalShare || { userId: memberId, share: 0 };
          }

          // Otherwise keep their share at 0 (excluded)
          return existingShare || { userId: memberId, share: 0 };
        });

        setShares(updatedShares);
      }
    },
    [splitType, shares]
  );

  // Handle individual share changes
  const updateShareAmount = useCallback((userId: string, value: string) => {
    const shareValue = value === '' ? 0 : parseFloat(value);

    setShares(prev =>
      prev.map(share => (share.userId === userId ? { ...share, share: shareValue } : share))
    );

    // Switch to custom split when manually changing shares
    setSplitType('custom');
  }, []);

  // Handle member toggling (include/exclude from split)
  const toggleMember = useCallback(
    (userId: string, isEnabled: boolean, totalAmount: number) => {
      // If enabling, assign an equal share; if disabling, set share to 0
      if (isNaN(totalAmount)) return;

      if (isEnabled) {
        // Count currently active members to calculate new share
        const currentActiveCount =
          shares.filter(s => s.userId !== userId && s.share > 0).length + 1;
        const newEqualShare = totalAmount / currentActiveCount;

        // Update all active shares to be equal
        const activeMembers = shares
          .filter(s => s.userId === userId || s.share > 0)
          .map(s => s.userId);

        const updatedShares = shares.map(share => {
          if (activeMembers.includes(share.userId)) {
            return { ...share, share: parseFloat(newEqualShare.toFixed(2)) };
          }
          return share;
        });

        // Adjust first share to account for rounding errors
        const totalShares = updatedShares.reduce((sum, share) => sum + share.share, 0);
        const diff = totalAmount - totalShares;
        if (Math.abs(diff) > 0.01) {
          const firstActiveIndex = updatedShares.findIndex(s => activeMembers.includes(s.userId));
          if (firstActiveIndex >= 0) {
            updatedShares[firstActiveIndex].share = parseFloat(
              (updatedShares[firstActiveIndex].share + diff).toFixed(2)
            );
          }
        }

        setShares(updatedShares);
      } else {
        // Just disable this member by setting share to 0
        const updatedShares = shares.map(share =>
          share.userId === userId ? { ...share, share: 0 } : share
        );

        // If there are other active members and we're disabling one, redistribute
        const activeShares = updatedShares.filter(s => s.userId !== userId && s.share > 0);
        if (activeShares.length > 0) {
          const newEqualShare = totalAmount / activeShares.length;

          activeShares.forEach(share => {
            const index = updatedShares.findIndex(s => s.userId === share.userId);
            if (index >= 0) {
              updatedShares[index].share = parseFloat(newEqualShare.toFixed(2));
            }
          });

          // Adjust first share to account for rounding errors
          const totalShares = updatedShares.reduce((sum, share) => sum + share.share, 0);
          const diff = totalAmount - totalShares;
          if (Math.abs(diff) > 0.01) {
            const firstActiveIndex = updatedShares.findIndex(
              s => s.userId !== userId && s.share > 0
            );
            if (firstActiveIndex >= 0) {
              updatedShares[firstActiveIndex].share = parseFloat(
                (updatedShares[firstActiveIndex].share + diff).toFixed(2)
              );
            }
          }
        }

        setShares(updatedShares);
      }
    },
    [shares]
  );

  // Handle split type changes
  const changeSplitType = useCallback(
    (newSplitType: 'equal' | 'custom', amount: number, memberIds: string[]) => {
      setSplitType(newSplitType);

      if (newSplitType === 'equal' && !isNaN(amount) && amount > 0) {
        // Get currently active members to maintain who is excluded
        const activeMembers = shares.filter(share => share.share > 0).map(share => share.userId);

        // If no active members (first load), use all members
        const membersToUse = activeMembers.length > 0 ? activeMembers : memberIds;

        const equalShares = calculateEqualShares(membersToUse, amount);

        // Apply the equal shares but maintain excluded members
        const updatedShares = shares.map(share => {
          // If this member was active or we're starting fresh, update their share
          if (activeMembers.includes(share.userId) || activeMembers.length === 0) {
            const equalShare = equalShares.find(s => s.userId === share.userId);
            return equalShare || share;
          }
          // Otherwise keep their share at 0 (excluded)
          return share;
        });

        setShares(updatedShares);
      }
    },
    [shares]
  );

  // Initialize shares for a group
  const initializeSharesForGroup = useCallback(
    (memberIds: string[], amount: number) => {
      if (isNaN(amount) || memberIds.length === 0) {
        return setShares([]);
      }

      if (splitType === 'equal') {
        const equalShares = calculateEqualShares(memberIds, amount);
        setShares(equalShares);
      } else {
        // For custom split, initialize all with zero
        const initialShares = memberIds.map(id => ({ userId: id, share: 0 }));
        setShares(initialShares);
      }
    },
    [splitType]
  );

  return {
    shares,
    setShares,
    splitType,
    setSplitType,
    recalculateShares,
    updateShareAmount,
    toggleMember,
    changeSplitType,
    initializeSharesForGroup,
  };
}
