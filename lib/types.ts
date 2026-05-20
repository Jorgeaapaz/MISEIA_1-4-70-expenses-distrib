import { ObjectId } from 'mongodb';

export interface Group {
  _id?: ObjectId;
  name: string;
  members: string[];
  createdAt: Date;
}

export interface Expense {
  _id?: ObjectId;
  groupId: ObjectId;
  paidBy: string;
  amount: number;
  description: string;
  createdAt: Date;
}

export interface Settlement {
  from: string;
  to: string;
  amount: number;
}
