'use client';

import { useState, useRef, use } from 'react';
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
import { GroupMember } from '@/types';
import { ExpenseList } from '@/components/expenses/ExpenseList';

export default function GroupDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = use(params);
  const {
    groups,
    users,
    groupMembers: allGroupMembers,
    setGroupMembers,
    currentUser,
  } = useAppContext();
  const { getGroupExpenses, getGroupMembers, calculateGroupBalances, calculateSimplifiedPayments } =
    useExpenseCalculations();

  const [activeTab, setActiveTab] = useState('expenses');
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const shareUrlRef = useRef<HTMLInputElement>(null);

  const group = groups.find(g => g.id === groupId);

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

  const balances = calculateGroupBalances(groupId);
  const simplifiedPayments = calculateSimplifiedPayments(groupId);

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

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleJoinGroup = () => {
    if (!currentUser) return;

    const newMember: GroupMember = {
      userId: currentUser.id,
      groupId: groupId,
    };

    setGroupMembers(prev => [...prev, newMember]);
  };

  const handleLeaveGroup = () => {
    if (!currentUser) return;

    setGroupMembers(prev =>
      prev.filter(member => !(member.userId === currentUser.id && member.groupId === groupId))
    );
  };

  const handleCopyShareLink = () => {
    if (shareUrlRef.current) {
      shareUrlRef.current.select();
      document.execCommand('copy');
      setCopySuccess(true);

      // Reset the success message after 2 seconds
      setTimeout(() => {
        setCopySuccess(false);
      }, 2000);
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
              <Button onClick={handleJoinGroup}>Join Group</Button>
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
            <TabsTrigger value="balances">Balances</TabsTrigger>
            <TabsTrigger value="settlements">Settlements</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
          </TabsList>

          <TabsContent value="expenses">
            <ExpenseList expenses={groupExpenses} groupId={groupId} showGroupColumn={false} />
          </TabsContent>

          <TabsContent value="balances">
            <Card>
              <CardHeader>
                <CardTitle>Current Balances</CardTitle>
                <CardDescription>See who owes what in this group</CardDescription>
              </CardHeader>
              <CardContent>
                {balances.length > 0 ? (
                  <div className="space-y-4">
                    {balances.map(balance => (
                      <div
                        key={balance.userId}
                        className="flex items-center justify-between py-2 border-b last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{balance.userName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span>{balance.userName}</span>
                        </div>
                        <div
                          className={`font-semibold ${
                            balance.amount > 0
                              ? 'text-green-600'
                              : balance.amount < 0
                                ? 'text-red-600'
                                : ''
                          }`}
                        >
                          {balance.amount > 0
                            ? `Gets back ${formatAmount(balance.amount)}`
                            : balance.amount < 0
                              ? `Owes ${formatAmount(Math.abs(balance.amount))}`
                              : 'Settled up'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    No balances to show. Add expenses to see balances.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settlements">
            <Card>
              <CardHeader>
                <CardTitle>Suggested Settlements</CardTitle>
                <CardDescription>Simplified payments to settle all debts</CardDescription>
              </CardHeader>
              <CardContent>
                {simplifiedPayments.length > 0 ? (
                  <div className="space-y-4">
                    {simplifiedPayments.map((payment, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-2 border-b last:border-0"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback>{payment.fromName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span>{payment.fromName}</span>
                          </div>
                        </div>
                        <div className="flex-1 text-center">
                          <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-sm">
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
                              className="mr-1 text-gray-600"
                            >
                              <path d="M6 12h12"></path>
                              <path d="M12 18V6"></path>
                            </svg>
                            <span>{formatAmount(payment.amount)}</span>
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
                              className="ml-1 text-gray-600"
                            >
                              <path d="M5 12h14"></path>
                              <path d="M12 5l7 7-7 7"></path>
                            </svg>
                          </div>
                        </div>
                        <div className="flex-1 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span>{payment.toName}</span>
                            <Avatar className="h-6 w-6">
                              <AvatarFallback>{payment.toName.charAt(0)}</AvatarFallback>
                            </Avatar>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    No settlements needed. Everyone is settled up!
                  </p>
                )}
              </CardContent>
            </Card>
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
                          <Button variant="outline" size="sm" onClick={handleLeaveGroup}>
                            Leave Group
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
              Share this group with friends to split expenses together
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium">Share Link</label>
              <div className="flex space-x-2">
                <Input
                  ref={shareUrlRef}
                  value={`https://splitsquad.example.com/invite/${groupId}`}
                  readOnly
                />
                <Button onClick={handleCopyShareLink}>{copySuccess ? 'Copied!' : 'Copy'}</Button>
              </div>
              <p className="text-sm text-gray-500">
                Share this link with friends to invite them to your group
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
