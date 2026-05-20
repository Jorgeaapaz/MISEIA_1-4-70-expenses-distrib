import { getDb } from '@/lib/mongodb';
import { calculateSettlement } from '@/lib/settlement';
import { Expense } from '@/lib/types';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const db = await getDb();
  const group = await db.collection('groups').findOne({ name });

  if (!group) {
    return Response.json({ error: 'Group not found' }, { status: 404 });
  }

  const expenses = (await db
    .collection('expenses')
    .find({ groupId: group._id })
    .toArray()) as unknown as Expense[];

  const settlements = calculateSettlement(group.members, expenses);

  return Response.json(settlements);
}
