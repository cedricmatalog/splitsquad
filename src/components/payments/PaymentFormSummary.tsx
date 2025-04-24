'use client';

import { User } from '@/types';
import { ArrowRight, UserIcon } from 'lucide-react';

interface PaymentFormSummaryProps {
  fromUser: string;
  toUser: string;
  amount: number;
  getUserById: (userId: string) => User | undefined;
  formatAmount: (amount: number) => string;
}

export function PaymentFormSummary({
  fromUser,
  toUser,
  amount,
  getUserById,
  formatAmount,
}: PaymentFormSummaryProps) {
  return (
    <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
      <h4 className="font-medium text-sm mb-2">Payment Summary</h4>
      <div className="flex items-center justify-center space-x-2">
        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
          <UserIcon className="h-4 w-4 text-blue-600" />
        </div>
        <span className="font-medium">{getUserById(fromUser)?.name}</span>
        <div className="flex items-center px-2">
          <ArrowRight className="h-4 w-4 text-gray-400" />
          <span className="mx-2 bg-green-100 text-green-800 font-semibold px-2 py-1 rounded">
            {formatAmount(amount)}
          </span>
          <ArrowRight className="h-4 w-4 text-gray-400" />
        </div>
        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
          <UserIcon className="h-4 w-4 text-blue-600" />
        </div>
        <span className="font-medium">{getUserById(toUser)?.name}</span>
      </div>
    </div>
  );
}
