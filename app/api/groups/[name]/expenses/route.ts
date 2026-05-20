import { getDb } from '@/lib/mongodb';

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

  const expenses = await db
    .collection('expenses')
    .find({ groupId: group._id })
    .sort({ createdAt: -1 })
    .toArray();

  return Response.json(expenses);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const { paidBy, amount, description } = await request.json();

  if (!paidBy || !amount || !description) {
    return Response.json({ error: 'paidBy, amount, and description are required' }, { status: 400 });
  }

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return Response.json({ error: 'Amount must be a positive number' }, { status: 400 });
  }

  const db = await getDb();
  const group = await db.collection('groups').findOne({ name });

  if (!group) {
    return Response.json({ error: 'Group not found' }, { status: 404 });
  }

  if (!group.members.includes(paidBy)) {
    return Response.json({ error: 'paidBy must be a member of the group' }, { status: 400 });
  }

  await db.collection('expenses').insertOne({
    groupId: group._id,
    paidBy,
    amount: parsedAmount,
    description: description.trim(),
    createdAt: new Date(),
  });

  return Response.json({ success: true }, { status: 201 });
}
