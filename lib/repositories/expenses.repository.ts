import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/mongodb';
import type { Expense } from '@/lib/types';

export async function findExpensesByGroupId(groupId: ObjectId): Promise<Expense[]> {
  const db = await getDb();
  return db
    .collection<Expense>('expenses')
    .find({ groupId })
    .sort({ createdAt: -1 })
    .toArray() as Promise<Expense[]>;
}

export async function insertExpense(data: {
  groupId: ObjectId;
  paidBy: string;
  amount: number;
  description: string;
}): Promise<void> {
  const db = await getDb();
  await db.collection('expenses').insertOne({
    ...data,
    createdAt: new Date(),
  });
}
