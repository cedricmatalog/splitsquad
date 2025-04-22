'use client';

import { useState, useRef, use, useEffect } from 'react';
import Link from 'next/link';
import { useAppContext } from '@/context/AppContext';
import useExpenseCalculations from '@/hooks/useExpenseCalculations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ExpenseList } from '@/components/expenses/ExpenseList';
import { BalanceOverview } from '@/components/balances/BalanceOverview';
import { DetailedBalances } from '@/components/balances/DetailedBalances';
import { SettlementSuggestions } from '@/components/balances/SettlementSuggestions';
import { PaymentHistory } from '@/components/payments/PaymentHistory';
import { createGroupMember, deleteGroupMemberByKeys } from '@/services/group_members';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

// Spinner component
function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn('animate-spin h-4 w-4', className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );
}

export default function GroupDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = use(params);
  const {
    groups,
    users,
    groupMembers: allGroupMembers,
    setGroupMembers,
    currentUser,
  } = useAppContext();
  const { getGroupExpenses, getGroupMembers } = useExpenseCalculations();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('expenses');
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const shareUrlRef = useRef<HTMLInputElement>(null);

  const group = groups.find(g => g.id === groupId);

  // Redirect to login if user is not authenticated
  useEffect(() => {
    if (!currentUser) {
      // Save current URL for redirection after login
      if (typeof window !== 'undefined') {
        localStorage.setItem('redirectAfterLogin', window.location.pathname);
      }
      router.push('/login');
    } else {
      setIsLoading(false);
    }
  }, [currentUser, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="container mx-auto py-8 max-w-6xl text-center">
        <h1 className="text-3xl font-bold mb-4">Group Not Found</h1>
        <p className="mb-6 text-gray-500">The group you&apos;re looking for doesn&apos;t exist.</p>
        <Button asChild>
          <Link href="/groups">Back to Groups</Link>
        </Button>
      </div>
    );
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
        // Optionally, redirect or show a message
        // router.push('/groups');
      } else {
        console.error('Failed to leave group');
        // Optionally show error to user
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
                <Button variant="outline" onClick={() => setShareDialogOpen(true)}>
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
                  <Link href={`/groups/${groupId}/edit`}>Edit Group</Link>
                </Button>
                <Button asChild>
                  <Link href={`/expenses/new?groupId=${groupId}`}>Add Expense</Link>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Created By</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
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
              onClick={() => setMembersDialogOpen(true)}
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

      {isUserMember ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="mb-6">
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="balances">Balances</TabsTrigger>
            <TabsTrigger value="settlements">Settlements</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
          </TabsList>

          <TabsContent value="expenses">
            <ExpenseList expenses={groupExpenses} groupId={groupId} showGroupColumn={false} />
          </TabsContent>

          <TabsContent value="payments">
            <div className="flex flex-col gap-4">
              <div className="flex justify-end">
                <Button asChild>
                  <Link
                    href={`/groups/${groupId}/payments/new`}
                    className="flex items-center gap-1"
                  >
                    Record Payment
                  </Link>
                </Button>
              </div>
              <PaymentHistory groupId={groupId} />
            </div>
          </TabsContent>

          <TabsContent value="balances">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <BalanceOverview groupId={groupId} />
              <DetailedBalances groupId={groupId} />
            </div>
          </TabsContent>

          <TabsContent value="settlements">
            <SettlementSuggestions groupId={groupId} />
          </TabsContent>

          <TabsContent value="members">
            <Card>
              <CardHeader>
                <CardTitle>Group Members</CardTitle>
                <CardDescription>People participating in this group</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {groupMembers.map(member => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.avatar} alt={member.name} />
                          <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-gray-500">{member.email}</p>
                        </div>
                      </div>

                      {currentUser &&
                        currentUser.id === member.id &&
                        member.id !== group.createdBy && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleLeaveGroup}
                            disabled={isLeaving}
                          >
                            {isLeaving ? (
                              <>
                                <Spinner /> Leaving...
                              </>
                            ) : (
                              'Leave Group'
                            )}
                          </Button>
                        )}

                      {member.id === group.createdBy && (
                        <div className="text-sm text-gray-500 italic">Group Admin</div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Join This Group</CardTitle>
            <CardDescription>Join this group to see expenses and balances</CardDescription>
          </CardHeader>
          <CardContent className="text-center py-6">
            <p className="mb-4 text-gray-500">
              You need to join this group to see expenses and balances.
            </p>
            <Button onClick={handleJoinGroup}>Join Group</Button>
          </CardContent>
        </Card>
      )}

      {/* Members Dialog */}
      <Dialog open={membersDialogOpen} onOpenChange={setMembersDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Group Members</DialogTitle>
            <DialogDescription>People participating in {group.name}</DialogDescription>
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

                {member.id === group.createdBy && (
                  <div className="text-sm bg-gray-100 px-2 py-1 rounded">Admin</div>
                )}
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMembersDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
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
            <Button variant="outline" onClick={() => setShareDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
