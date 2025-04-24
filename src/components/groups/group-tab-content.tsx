'use client';

import Link from 'next/link';
import { Button } from '@/components/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui';
import { TabsContent } from '@/components/ui';
import { ExpenseList } from '@/components/expenses/list';
import { BalanceOverview } from '@/components/balances/BalanceOverview';
import { DetailedBalances } from '@/components/balances/DetailedBalances';
import { SettlementSuggestions } from '@/components/balances/SettlementSuggestions';
import { PaymentHistory } from '@/components/payments';
import { Spinner } from '@/components/ui';
import { User, Expense } from '@/types';

interface GroupTabContentProps {
  activeTab: string;
  groupId: string;
  groupExpenses: Expense[];
  groupMembers: User[];
  currentUser: User | null;
  handleLeaveGroup: () => Promise<void>;
  isLeaving: boolean;
  groupCreatorId?: string;
}

export function GroupTabContent({
  activeTab,
  groupId,
  groupExpenses,
  groupMembers,
  currentUser,
  handleLeaveGroup,
  isLeaving,
  groupCreatorId,
}: GroupTabContentProps) {
  return (
    <TabsContent value={activeTab}>
      {activeTab === 'expenses' && (
        <ExpenseList expenses={groupExpenses} groupId={groupId} showGroupColumn={false} limit={6} />
      )}

      {activeTab === 'payments' && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            <Button asChild>
              <Link href={`/groups/${groupId}/payments/new`} className="flex items-center gap-1">
                Record Payment
              </Link>
            </Button>
          </div>
          <PaymentHistory groupId={groupId} />
        </div>
      )}

      {activeTab === 'balances' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <BalanceOverview groupId={groupId} />
          <DetailedBalances groupId={groupId} />
        </div>
      )}

      {activeTab === 'settlements' && <SettlementSuggestions groupId={groupId} />}

      {activeTab === 'members' && (
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
                    groupCreatorId &&
                    member.id !== groupCreatorId && (
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

                  {groupCreatorId && member.id === groupCreatorId && (
                    <div className="text-sm text-gray-500 italic">Group Admin</div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </TabsContent>
  );
}
