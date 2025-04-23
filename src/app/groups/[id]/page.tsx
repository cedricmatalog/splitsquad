'use client';

import { useState, useRef, use } from 'react';
import { useAppContext } from '@/context/AppContext';
import useExpenseCalculations from '@/hooks/useExpenseCalculations';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createGroupMember, deleteGroupMemberByKeys } from '@/services/group_members';
import useAuthRedirect from '@/hooks/useAuthRedirect';

// Import extracted components
import { LoadingState } from '@/components/ui/loading-state';
import { GroupNotFound } from '@/components/groups/group-not-found';
import { GroupHeader } from '@/components/groups/group-header';
import { GroupInfoCards } from '@/components/groups/group-info-cards';
import { GroupJoinPrompt } from '@/components/groups/group-join-prompt';
import { GroupTabContent } from '@/components/groups/group-tab-content';
import { MembersDialog } from '@/components/groups/members-dialog';
import { ShareDialog } from '@/components/groups/share-dialog';

export default function GroupDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = use(params);
  const {
    groups,
    users,
    groupMembers: allGroupMembers,
    setGroupMembers,
    currentUser,
    isLoading: contextLoading,
  } = useAppContext();
  const { isReady } = useAuthRedirect();
  const { getGroupExpenses, getGroupMembers } = useExpenseCalculations();

  const [activeTab, setActiveTab] = useState('expenses');
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const shareUrlRef = useRef<HTMLInputElement | null>(null);

  const group = groups.find(g => g.id === groupId);

  // If still loading, show spinner
  if (contextLoading || !isReady) {
    return <LoadingState />;
  }

  if (!group) {
    return <GroupNotFound />;
  }

  const groupExpenses = getGroupExpenses(groupId);
  const groupMembers = getGroupMembers(groupId);

  // Check if current user is a member of this group
  const isUserMember = currentUser
    ? allGroupMembers.some(member => member.userId === currentUser.id && member.groupId === groupId)
    : false;

  const getCreatorName = (creatorId: string) => {
    const creator = users.find(user => user.id === creatorId);
    return creator ? creator.name : 'Unknown';
  };

  const getCreatorAvatar = (creatorId: string) => {
    const creator = users.find(user => user.id === creatorId);
    return creator ? creator.avatar : '';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleJoinGroup = async () => {
    if (!currentUser) return;

    setIsJoining(true);

    try {
      // Create membership in Supabase
      const newMemberData = { userId: currentUser.id, groupId };
      const created = await createGroupMember(newMemberData);
      if (created) {
        // Update local context state with persisted member
        setGroupMembers(prev => [...prev, created]);
      } else {
        console.error('Failed to join group');
      }
    } catch (error) {
      console.error('Error joining group:', error);
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!currentUser) return;

    setIsLeaving(true);

    try {
      // Delete membership from Supabase
      const deleted = await deleteGroupMemberByKeys(currentUser.id, groupId);

      if (deleted) {
        // Update local context state
        setGroupMembers(prev =>
          prev.filter(member => !(member.userId === currentUser.id && member.groupId === groupId))
        );
      } else {
        console.error('Failed to leave group');
      }
    } catch (error) {
      console.error('Error leaving group:', error);
    } finally {
      setIsLeaving(false);
    }
  };

  const handleCopyShareLink = async () => {
    try {
      if (shareUrlRef.current) {
        // Use direct group link
        shareUrlRef.current.value = `${window.location.origin}/groups/${groupId}`;
        shareUrlRef.current.select();
        document.execCommand('copy');
        setCopySuccess(true);

        // Reset the success message after 2 seconds
        setTimeout(() => {
          setCopySuccess(false);
        }, 2000);
      }
    } catch (err) {
      console.error('Error copying link:', err);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <GroupHeader
        group={group}
        isUserMember={isUserMember}
        onShareClick={() => setShareDialogOpen(true)}
        handleJoinGroup={handleJoinGroup}
        isJoining={isJoining}
      />

      <GroupInfoCards
        group={group}
        groupMembers={groupMembers}
        getCreatorName={getCreatorName}
        getCreatorAvatar={getCreatorAvatar}
        formatDate={formatDate}
        onViewAllMembersClick={() => setMembersDialogOpen(true)}
      />

      {isUserMember ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="mb-6">
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="balances">Balances</TabsTrigger>
            <TabsTrigger value="settlements">Settlements</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
          </TabsList>

          <GroupTabContent
            activeTab={activeTab}
            groupId={groupId}
            groupExpenses={groupExpenses}
            groupMembers={groupMembers}
            currentUser={currentUser}
            handleLeaveGroup={handleLeaveGroup}
            isLeaving={isLeaving}
            groupCreatorId={group.createdBy}
          />
        </Tabs>
      ) : (
        <GroupJoinPrompt handleJoinGroup={handleJoinGroup} />
      )}

      <MembersDialog
        isOpen={membersDialogOpen}
        onOpenChange={setMembersDialogOpen}
        groupMembers={groupMembers}
        groupName={group.name}
        groupCreatorId={group.createdBy}
      />

      <ShareDialog
        isOpen={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        groupId={groupId}
        shareUrlRef={shareUrlRef}
        handleCopyShareLink={handleCopyShareLink}
        copySuccess={copySuccess}
      />
    </div>
  );
}
