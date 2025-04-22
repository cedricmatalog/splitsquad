export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  date: string;
}

export interface Expense {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  paidBy: string;
  date: string;
}

export interface GroupMember {
  userId: string;
  groupId: string;
}

export interface ExpenseParticipant {
  expenseId: string;
  userId: string;
  share: number;
}

export interface Payment {
  id: string;
  fromUser: string;
  toUser: string;
  amount: number;
  date: string;
  groupId: string;
  paymentMethod?: string;
  notes?: string;
}
